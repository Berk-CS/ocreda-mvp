/*
 * Tests for the pure logic behind find-relevant-notes. No network, no Supabase.
 *   npm run test:relevance
 */

const assert = require('assert');
const {
  dealIntoChunks,
  parseAgentResponse,
  mergeAgentResults,
  runRelevanceAgents,
  condenseDraft,
  truncate,
} = require('../.relevance-build/relevance.js');

let passed = 0;
const pending = [];

function test(name, fn) {
  pending.push([name, fn]);
}

async function run() {
  for (const [name, fn] of pending) {
    try {
      await fn();
      passed++;
      console.log(`  ok  ${name}`);
    } catch (err) {
      console.error(`FAIL  ${name}\n      ${err.message}`);
      process.exitCode = 1;
    }
  }
  console.log(`\n${passed}/${pending.length} passed\n`);
}

const note = (id, createdAt = '2026-01-01') => ({ id, raw_text: id, summary: null, created_at: createdAt });
const ids = (n) => Array.from({ length: n }, (_, i) => note(`id-${i}`));

// ---------------------------------------------------------------- chunking

test('500 notes across 10 agents gives 50 each, nothing lost or duplicated', () => {
  const chunks = dealIntoChunks(ids(500), 10);
  assert.strictEqual(chunks.length, 10);
  chunks.forEach((c) => assert.strictEqual(c.length, 50));
  assert.strictEqual(new Set(chunks.flat().map((n) => n.id)).size, 500);
});

test('uneven split spreads the remainder rather than dropping it', () => {
  const chunks = dealIntoChunks(ids(23), 10);
  assert.strictEqual(chunks.flat().length, 23);
  assert.deepStrictEqual(chunks.map((c) => c.length), [3, 3, 3, 2, 2, 2, 2, 2, 2, 2]);
});

test('round-robin interleaves by age instead of grouping eras', () => {
  const chunks = dealIntoChunks([note('a'), note('b'), note('c'), note('d'), note('e'), note('f')], 3);
  assert.deepStrictEqual(chunks[0].map((n) => n.id), ['a', 'd']);
  assert.deepStrictEqual(chunks[1].map((n) => n.id), ['b', 'e']);
});

test('fewer notes than agents yields one note per chunk, no empty chunks', () => {
  const chunks = dealIntoChunks(ids(3), 10);
  assert.strictEqual(chunks.length, 3);
  chunks.forEach((c) => assert.strictEqual(c.length, 1));
});

test('empty corpus yields no chunks', () => {
  assert.deepStrictEqual(dealIntoChunks([], 10), []);
});

// ------------------------------------------------------------- parsing

const allowed = new Set(['keep-1', 'keep-2']);
const row = (over) => JSON.stringify([{ note_id: 'keep-1', relevance_score: 0.8, relation_type: 'supports', explanation: 'because', ...over }]);

test('accepts a well-formed row', () => {
  const out = parseAgentResponse(row(), allowed);
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].relation_type, 'supports');
});

test('drops a hallucinated id the agent was never shown', () => {
  assert.deepStrictEqual(parseAgentResponse(row({ note_id: 'not-in-chunk' }), allowed), []);
});

test('drops scores below the 0.5 floor', () => {
  assert.deepStrictEqual(parseAgentResponse(row({ relevance_score: 0.3 }), allowed), []);
});

test('clamps a score above 1', () => {
  assert.strictEqual(parseAgentResponse(row({ relevance_score: 4 }), allowed)[0].relevance_score, 1);
});

test('drops a non-numeric score', () => {
  assert.deepStrictEqual(parseAgentResponse(row({ relevance_score: 'very' }), allowed), []);
});

test('falls back to "extends" for an unknown relation type', () => {
  assert.strictEqual(parseAgentResponse(row({ relation_type: 'vibes' }), allowed)[0].relation_type, 'extends');
});

test('drops a row with no explanation', () => {
  assert.deepStrictEqual(parseAgentResponse(row({ explanation: '   ' }), allowed), []);
});

test('keeps the gist alongside the explanation', () => {
  const out = parseAgentResponse(row({ gist: '  what the note says  ' }), allowed);
  assert.strictEqual(out[0].gist, 'what the note says');
  assert.strictEqual(out[0].explanation, 'because');
});

test('keeps a row with no gist, leaving it empty', () => {
  const out = parseAgentResponse(row({ gist: 42 }), allowed);
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].gist, '');
});

test('survives a ```json fence', () => {
  assert.strictEqual(parseAgentResponse('```json\n' + row() + '\n```', allowed).length, 1);
});

test('survives prose wrapped around the array', () => {
  assert.strictEqual(parseAgentResponse(`Sure! Here you go:\n${row()}\nHope that helps.`, allowed).length, 1);
});

test('an empty array is a valid answer, not an error', () => {
  assert.deepStrictEqual(parseAgentResponse('[]', allowed), []);
});

test('unparseable output yields nothing rather than throwing', () => {
  assert.deepStrictEqual(parseAgentResponse('I could not do that.', allowed), []);
  assert.deepStrictEqual(parseAgentResponse('[{broken', allowed), []);
  assert.deepStrictEqual(parseAgentResponse('{"note_id":"keep-1"}', allowed), []);
});

test('keeps only the first of a repeated id', () => {
  const dupes = JSON.stringify([
    { note_id: 'keep-1', relevance_score: 0.9, relation_type: 'supports', explanation: 'first' },
    { note_id: 'keep-1', relevance_score: 0.6, relation_type: 'extends', explanation: 'second' },
  ]);
  const out = parseAgentResponse(dupes, allowed);
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].explanation, 'first');
});

test('skips null entries without dropping good ones', () => {
  const mixed = JSON.stringify([null, { note_id: 'keep-2', relevance_score: 0.7, relation_type: 'question', explanation: 'ok' }]);
  assert.strictEqual(parseAgentResponse(mixed, allowed).length, 1);
});

// ------------------------------------------------------------- merging

const res = (id, score) => ({ note_id: id, relevance_score: score, relation_type: 'extends', explanation: 'x' });

test('ranks by score across agents, highest first', () => {
  const { results } = mergeAgentResults(
    [
      { chunkSize: 2, results: [res('low', 0.55)] },
      { chunkSize: 2, results: [res('high', 0.95)] },
      { chunkSize: 2, results: [res('mid', 0.7)] },
    ],
    new Map(),
    50
  );
  assert.deepStrictEqual(results.map((r) => r.note_id), ['high', 'mid', 'low']);
});

test('a failed agent is excluded from the searched count', () => {
  const { notesSearched } = mergeAgentResults(
    [{ chunkSize: 50, results: [] }, { chunkSize: 50, results: null }, { chunkSize: 50, results: [] }],
    new Map(),
    50
  );
  assert.strictEqual(notesSearched, 100, 'the failed agent’s 50 notes must not count as searched');
});

test('all agents succeeding counts every note', () => {
  const outcomes = Array.from({ length: 10 }, () => ({ chunkSize: 50, results: [] }));
  assert.strictEqual(mergeAgentResults(outcomes, new Map(), 50).notesSearched, 500);
});

test('ties break toward the newer note', () => {
  const createdAt = new Map([['older', '2026-01-01'], ['newer', '2026-06-01']]);
  const { results } = mergeAgentResults([{ chunkSize: 2, results: [res('older', 0.8), res('newer', 0.8)] }], createdAt, 50);
  assert.deepStrictEqual(results.map((r) => r.note_id), ['newer', 'older']);
});

test('caps the returned list at maxResults', () => {
  const many = Array.from({ length: 80 }, (_, i) => res(`n-${i}`, 0.5 + i / 1000));
  assert.strictEqual(mergeAgentResults([{ chunkSize: 80, results: many }], new Map(), 50).results.length, 50);
});

test('the same note from two agents keeps the higher score', () => {
  const { results } = mergeAgentResults(
    [{ chunkSize: 1, results: [res('dupe', 0.6)] }, { chunkSize: 1, results: [res('dupe', 0.9)] }],
    new Map(),
    50
  );
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].relevance_score, 0.9);
});

test('every agent failing reports nothing searched', () => {
  const { results, notesSearched } = mergeAgentResults(
    [{ chunkSize: 50, results: null }, { chunkSize: 50, results: null }],
    new Map(),
    50
  );
  assert.strictEqual(notesSearched, 0);
  assert.deepStrictEqual(results, []);
});

// --------------------------------------------------------- orchestration

const okResponse = (id) => JSON.stringify([{ note_id: id, relevance_score: 0.8, relation_type: 'supports', explanation: 'ok' }]);
const never = () => false;
const always = () => true;

test('a fan-out where every agent succeeds reads the whole corpus', async () => {
  const { outcomes } = await runRelevanceAgents({
    draft: 'draft', notes: ids(50), agentCount: 10, concurrency: 5,
    generate: async () => '[]', isRetryable: never,
  });
  assert.strictEqual(outcomes.length, 10);
  assert.strictEqual(outcomes.reduce((sum, o) => sum + o.chunkSize, 0), 50);
  outcomes.forEach((o) => assert.ok(Array.isArray(o.results)));
});

test('one permanently failing agent does not sink the others', async () => {
  let call = 0;
  const { outcomes } = await runRelevanceAgents({
    draft: 'draft', notes: ids(30), agentCount: 3, concurrency: 3,
    generate: async () => { if (call++ === 1) throw new Error('boom'); return '[]'; },
    isRetryable: never,
  });
  const failed = outcomes.filter((o) => o.results === null);
  assert.strictEqual(failed.length, 1, 'exactly one agent should be marked unread');
  assert.strictEqual(outcomes.filter((o) => o.results !== null).length, 2);
});

test('a retryable failure is retried and can then succeed', async () => {
  const attempts = new Map();
  const { outcomes } = await runRelevanceAgents({
    draft: 'draft', notes: [note('id-0')], agentCount: 1, concurrency: 1,
    generate: async (prompt) => {
      const n = (attempts.get(prompt) ?? 0) + 1;
      attempts.set(prompt, n);
      if (n === 1) throw new Error('429');
      return okResponse('id-0');
    },
    isRetryable: always,
  });
  assert.strictEqual([...attempts.values()][0], 2, 'should have taken a second attempt');
  assert.strictEqual(outcomes[0].results.length, 1);
});

test('a non-retryable failure is not retried', async () => {
  let calls = 0;
  const { outcomes } = await runRelevanceAgents({
    draft: 'draft', notes: [note('id-0')], agentCount: 1, concurrency: 1,
    generate: async () => { calls++; throw new Error('bad request'); },
    isRetryable: never,
  });
  assert.strictEqual(calls, 1);
  assert.strictEqual(outcomes[0].results, null);
});

test('an agent that fails twice is reported unread, not empty', async () => {
  const { outcomes } = await runRelevanceAgents({
    draft: 'draft', notes: [note('id-0')], agentCount: 1, concurrency: 1,
    generate: async () => { throw new Error('429'); },
    isRetryable: always,
  });
  assert.strictEqual(outcomes[0].results, null, 'null means unread; [] would mean "read, nothing relevant"');
});

test('concurrency limit is respected', async () => {
  let inFlight = 0; let peak = 0;
  await runRelevanceAgents({
    draft: 'draft', notes: ids(100), agentCount: 10, concurrency: 3,
    generate: async () => {
      inFlight++; peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 10));
      inFlight--;
      return '[]';
    },
    isRetryable: never,
  });
  assert.ok(peak <= 3, `expected at most 3 concurrent calls, saw ${peak}`);
});

test('results only survive if the id belongs to that agent’s own chunk', async () => {
  // Every agent claims note id-0, but only one was actually shown it.
  const { outcomes } = await runRelevanceAgents({
    draft: 'draft', notes: ids(10), agentCount: 10, concurrency: 5,
    generate: async () => okResponse('id-0'), isRetryable: never,
  });
  const total = outcomes.reduce((sum, o) => sum + (o.results?.length ?? 0), 0);
  assert.strictEqual(total, 1, 'the other nine agents’ claims on id-0 must be rejected');
});

// ------------------------------------------------------------ draft prep

test('a short draft passes through untouched', () => {
  assert.strictEqual(condenseDraft('hello'), 'hello');
});

test('a long draft keeps both the opening and the most recent writing', () => {
  const long = 'A'.repeat(4000) + 'B'.repeat(5000) + 'ZZZ-TAIL';
  const out = condenseDraft(long);
  assert.ok(out.startsWith('A'.repeat(100)), 'head must survive');
  assert.ok(out.endsWith('ZZZ-TAIL'), 'tail must survive');
  assert.ok(out.length < long.length);
});

test('truncate only trims past the limit', () => {
  assert.strictEqual(truncate('abc', 10), 'abc');
  assert.strictEqual(truncate('abcdef', 3), 'abc...');
});

run();
