#!/usr/bin/env node
/*
 * Runs the find-relevant-notes fan-out locally against a set of notes, using
 * the same chunking, prompt, parsing, and merging code the deployed Edge
 * Function uses. Needs only a Gemini API key — no Supabase, no auth, no deploy.
 *
 *   GEMINI_API_KEY=... npm run try:relevance
 *   GEMINI_API_KEY=... npm run try:relevance -- --notes my-notes.txt --draft draft.txt
 *
 * A notes file is either a JSON array of strings, or plain text with notes
 * separated by a line containing only "---".
 */

const fs = require('fs');
const path = require('path');
const { condenseDraft, mergeAgentResults, runRelevanceAgents } = require('../.relevance-build/relevance.js');
const { generateWithGemini, isRetryableGeminiError } = require('../.relevance-build/gemini.js');

const AGENT_COUNT = 10;
const AGENT_CONCURRENCY = 5;
const MAX_RESULTS = 50;
const AGENT_SYSTEM_PROMPT =
  "You identify meaningful relationships between a person's notes. You respond with a JSON array and nothing else.";

/*
 * A deliberately mixed sample: a handful of notes that genuinely bear on the
 * draft (one of each relation type), and a majority that merely share a word or
 * a mood. `expect` is only used to score the run afterwards; it never reaches
 * the model.
 */
const SAMPLE_DRAFT = `Rethinking how we charge

Per-seat pricing is quietly capping our own growth. Every new teammate a customer adds costs them more, so the people who'd get the most value out of the product are the ones most discouraged from spreading it. I think we should move to usage-based pricing before renewals in Q3.`;

const SAMPLE_NOTES = [
  { expect: 'supports', text: 'Call with Maya at Northwind. She admitted she stopped inviting teammates because every seat was another $12/mo. Her words: the tool got punished for being useful.' },
  { expect: 'supports', text: 'Pulled our expansion numbers. Accounts that reach three or more seats in month one churn about 40% less. Only 11% of accounts ever get there.' },
  { expect: 'contradicts', text: 'Decision from the March offsite: per-seat pricing stays as is. It is predictable, finance can forecast it, and revisiting is a distraction. Do not reopen this before next year.' },
  { expect: 'contradicts', text: 'Dev warned me that usage-based billing wrecked forecasting at his last company. Investors hated the revenue volatility and it came up in every board meeting.' },
  { expect: 'extends', text: 'Linear moved off pure per-seat last year. Their write-up claims net revenue retention climbed 18 points in the two quarters after.' },
  { expect: 'question', text: 'Still unresolved: how does variable billing survive enterprise procurement? Every RFP we have seen demands one fixed annual number up front.' },
  { expect: 'question', text: 'If we charge per action, what stops someone batching a whole month of work into one enormous call to game the meter?' },
  { expect: null, text: 'Squat form cue that finally worked: think about spreading the floor apart with your feet rather than pushing down into it.' },
  { expect: null, text: 'From the Ursula Le Guin essay: the trouble with utopia is that it is always someone else describing where you should want to live.' },
  { expect: null, text: 'Standup notes. Deploy is blocked on the migration review. Priya is out Thursday. Nobody has claimed the flaky integration test yet.' },
  { expect: null, text: 'Bread: 500g flour, 375g water, 10g salt, 100g starter. Autolyse an hour before adding salt. Cold proof overnight, bake at 250C with steam.' },
  { expect: null, text: 'The onboarding illustration set feels off. Too many gradients competing with the product screenshots behind them.' },
  { expect: null, text: 'Booked the Lisbon flights for April. Need to sort out the apartment before the end of the month or prices jump.' },
  { expect: null, text: 'Interview debrief: strong systems thinking, walked through the sharding tradeoff unprompted. Weak on the frontend exercise but that is coachable.' },
  { expect: null, text: 'Idea for the blog: nobody writes honestly about how boring most of the work is. The interesting part is maybe two hours a week.' },
  { expect: null, text: 'My laptop fan spins up whenever the design tool is open in a background tab. Probably worth just quitting it.' },
  { expect: null, text: 'Reminder: the dentist moved the appointment to the 14th at 8:30am. Do not schedule anything before ten that day.' },
  { expect: null, text: 'Reading note on attention: the claim is not that focus is scarce, but that the value of uninterrupted time compounds and we price it as if it were linear.' },
  { expect: null, text: 'The support inbox is drowning in password reset requests. Half of them are people who signed up with Google and forgot.' },
  { expect: null, text: 'Overheard on the train: someone explaining to their kid why the moon follows the car. Best answer was that it is very far away and very patient.' },
  { expect: null, text: 'Try switching the landing page headline to something concrete. The current one could describe any company in the category.' },
  { expect: null, text: 'Garden: the tomatoes went in too early last year and got hit by the late frost. Wait until after the first week of May.' },
  { expect: null, text: 'Note on hiring: every time we have compromised on the written communication bar it has cost us more time than the open role did.' },
  { expect: null, text: 'The CI runner is out of disk again. Someone should put a cleanup step in the nightly job instead of clearing it by hand each week.' },
  { expect: null, text: 'Book idea I will never write: a history of software told entirely through the changelogs of abandoned projects.' },
  { expect: null, text: 'Coffee place on Wilson closes at 2pm on weekends now. The one further down stays open but the espresso is much worse.' },
];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--notes') args.notes = argv[++i];
    else if (argv[i] === '--draft') args.draft = argv[++i];
  }
  return args;
}

function readNotesFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.json')) {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('A JSON notes file must contain an array of strings.');
    return parsed.map((text) => ({ expect: undefined, text: String(text) }));
  }
  return raw
    .split(/^---$/m)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((text) => ({ expect: undefined, text }));
}

const BADGES = { supports: 'SUPPORTS  ', extends: 'ADDS TO   ', contradicts: 'CONTRADICTS', question: 'QUESTION  ' };

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('\nSet GEMINI_API_KEY first. Get a free one at https://aistudio.google.com/apikey\n');
    console.error('  Windows PowerShell:  $env:GEMINI_API_KEY="..."; npm run try:relevance');
    console.error('  bash:                GEMINI_API_KEY=... npm run try:relevance\n');
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  const usingSample = !args.notes;
  const source = args.notes ? readNotesFile(path.resolve(args.notes)) : SAMPLE_NOTES;
  const draftText = args.draft
    ? (fs.existsSync(args.draft) ? fs.readFileSync(args.draft, 'utf8') : args.draft)
    : SAMPLE_DRAFT;

  // Stand in for the rows the Edge Function would have read from Supabase.
  const notes = source.map((entry, index) => ({
    id: `note-${String(index).padStart(3, '0')}`,
    raw_text: entry.text,
    summary: null,
    created_at: new Date(Date.now() - index * 86400000).toISOString(),
  }));
  const expectationById = new Map(notes.map((note, index) => [note.id, source[index].expect]));
  const textById = new Map(notes.map((note) => [note.id, note.raw_text]));

  console.log(`\nDraft:\n${draftText.trim().split('\n').map((l) => `  ${l}`).join('\n')}`);
  console.log(`\nSearching ${notes.length} notes across ${AGENT_COUNT} agents (${AGENT_CONCURRENCY} at a time)...\n`);

  const started = Date.now();
  const { outcomes } = await runRelevanceAgents({
    draft: condenseDraft(draftText.trim()),
    notes,
    agentCount: AGENT_COUNT,
    concurrency: AGENT_CONCURRENCY,
    isRetryable: isRetryableGeminiError,
    generate: (prompt) =>
      generateWithGemini(AGENT_SYSTEM_PROMPT, [{ role: 'user', content: prompt }], apiKey, undefined, {
        responseMimeType: 'application/json',
        temperature: 0.2,
      }),
    onAgentSettled: (index, outcome) => {
      const label = outcome.results ? `${outcome.results.length} hit(s)` : 'FAILED';
      console.log(`  agent ${String(index + 1).padStart(2)}  ${String(outcome.chunkSize).padStart(3)} notes  ->  ${label}`);
    },
  });

  const createdAtById = new Map(notes.map((n) => [n.id, n.created_at]));
  const { results, notesSearched } = mergeAgentResults(outcomes, createdAtById, MAX_RESULTS);
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  console.log(`\nSearched ${notesSearched} of ${notes.length} notes in ${elapsed}s. ${results.length} relevant.\n`);
  if (notesSearched < notes.length) {
    console.log(`  WARNING: ${notes.length - notesSearched} notes went unread because an agent failed.\n`);
  }

  results.forEach((result, index) => {
    const pct = `${Math.round(result.relevance_score * 100)}%`;
    console.log(`${String(index + 1).padStart(2)}. [${BADGES[result.relation_type]}] ${pct.padStart(4)}  ${textById.get(result.note_id).slice(0, 70)}...`);
    console.log(`    ${result.explanation}\n`);
  });

  if (!usingSample) return;

  // Scorecard: the sample notes are labelled, so the run can grade itself.
  const returned = new Set(results.map((r) => r.note_id));
  const expected = notes.filter((n) => expectationById.get(n.id));
  const missed = expected.filter((n) => !returned.has(n.id));
  const noise = results.filter((r) => expectationById.get(r.note_id) === null);
  const typeErrors = results.filter((r) => {
    const want = expectationById.get(r.note_id);
    return want && want !== r.relation_type;
  });

  console.log('--- scorecard -------------------------------------------');
  console.log(`  found        ${expected.length - missed.length}/${expected.length} of the notes that genuinely bear on the draft`);
  console.log(`  false hits   ${noise.length} unrelated note(s) surfaced`);
  console.log(`  wrong label  ${typeErrors.length} relation type(s) not what the note actually is`);
  missed.forEach((n) => console.log(`  MISSED  (${expectationById.get(n.id)}) ${n.raw_text.slice(0, 62)}...`));
  noise.forEach((r) => console.log(`  NOISE   ${textById.get(r.note_id).slice(0, 62)}...`));
  typeErrors.forEach((r) => console.log(`  LABEL   said "${r.relation_type}", expected "${expectationById.get(r.note_id)}"  ${textById.get(r.note_id).slice(0, 44)}...`));
  console.log('---------------------------------------------------------\n');
}

main().catch((error) => {
  console.error(`\nFailed: ${error.message}\n`);
  process.exit(1);
});
