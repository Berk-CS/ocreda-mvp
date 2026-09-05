/**
 * Pure logic behind the find-relevant-notes fan-out: chunking, prompt
 * construction, response validation, and merging. Kept free of Deno, Supabase,
 * and network calls so it can be exercised directly by tests.
 */

export const RELATION_TYPES = ["supports", "extends", "contradicts", "question"] as const;
export type RelationType = (typeof RELATION_TYPES)[number];

export const MAX_NOTE_CHARS = 800;
export const MAX_DRAFT_CHARS = 6000;
export const MIN_DRAFT_CHARS = 20;
export const MAX_EXPLANATION_CHARS = 200;
export const SCORE_FLOOR = 0.5;

export interface NoteLike {
  id: string;
  raw_text: string;
  summary: string | null;
  created_at: string;
}

export interface RelevanceResult {
  note_id: string;
  relevance_score: number;
  relation_type: RelationType;
  explanation: string;
}

export function truncate(text: string, limit: number): string {
  return text.length <= limit ? text : `${text.slice(0, limit)}...`;
}

/**
 * Long drafts get repeated into every agent prompt, so cap them — but keep the
 * tail as well as the head, since the thought a writer is currently developing
 * tends to live at the end of what they have written so far.
 */
export function condenseDraft(text: string): string {
  if (text.length <= MAX_DRAFT_CHARS) return text;
  return `${text.slice(0, 4000)}\n\n[...]\n\n${text.slice(-2000)}`;
}

/**
 * Deal notes out round-robin rather than in contiguous slices. Notes arrive
 * ordered by creation date, so slicing would hand one agent an entire era of
 * the user's thinking while another gets nothing on topic.
 */
export function dealIntoChunks<T>(items: T[], chunkCount: number): T[][] {
  const chunks: T[][] = Array.from({ length: Math.min(chunkCount, items.length) }, () => []);
  if (chunks.length === 0) return [];
  items.forEach((item, index) => chunks[index % chunks.length].push(item));
  return chunks;
}

export function buildPrompt(draft: string, notes: NoteLike[]): string {
  const candidates = notes
    .map((note) => `ID: ${note.id}\n${truncate((note.summary || note.raw_text).trim(), MAX_NOTE_CHARS)}`)
    .join("\n\n---\n\n");

  return `The user is writing this new note:
<draft>
${draft}
</draft>

Here are some notes from their existing knowledge base:

${candidates}

Decide which of these candidate notes are genuinely relevant to what the user is writing, and score each one on its own merits.

SCORING - judge each note against the draft in absolute terms. Do NOT score a note relative to the other candidates you were given. If every candidate here is irrelevant, return an empty array; that is a normal and correct outcome.

0.90-1.00 - The note is about the same specific claim, decision, or problem as the draft. Reading it would change what the user writes next.
0.70-0.89 - The note is on the same specific topic and contributes a concrete fact, example, or counterpoint the draft does not already contain.
0.50-0.69 - The note is adjacent: it shares a subject with the draft, or rests on the same underlying principle, and is useful as background.
Below 0.50 - Not relevant enough. Leave it out of your response entirely.

RELATION TYPE - pick exactly one:
"supports" - the note backs up a claim in the draft with evidence, reasoning, or a confirming example.
"extends" - the note is on the draft's topic and adds information the draft does not have.
"contradicts" - the note asserts something incompatible with the draft, or records a position the draft reverses.
"question" - the note raises an open problem or unresolved question that the draft touches but does not settle.

EXPLANATION - one sentence, under 25 words, naming the specific shared idea, tension, or claim. Never restate the note's summary. Never say "both are about X" without saying what about X connects them.

CRITICAL RULES:
- Most candidate notes will be irrelevant. Returning [] is common and correct. Do not pad your response.
- Never include a note merely because it shares words, names, or a broad category with the draft. The connection must be about substance.
- Use the exact ID string as given. Never invent an ID, and never return one that is not listed above.

Worked examples:
- Draft: "Charging per seat punishes teams for adding people, so we should move to usage-based pricing." Candidate note: "Talked to Maya - she stopped adding teammates to the tool because each one cost another $12/mo." Score 0.94, relation_type "supports", because it is direct evidence for the exact mechanism the draft claims.
- Draft: the same one. Candidate note: "Pricing page redesign - make the CTA green and move testimonials above the fold." Omitted entirely: it shares the word "pricing" but has nothing to do with the draft's argument.

Respond with ONLY a JSON array, no prose before or after:
[{"note_id": "<exact id>", "relevance_score": <number>, "relation_type": "<supports|extends|contradicts|question>", "explanation": "<one sentence>"}]`;
}

/**
 * The array counterpart of `extractJson` in ./gemini.ts, which only matches a
 * top-level object and so can never parse an agent's array response.
 */
export function extractJsonArray(raw: string): string | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : raw;
  const bare = candidate.match(/\[[\s\S]*\]/);
  return bare ? bare[0] : null;
}

/**
 * Turns one agent's raw text into trustworthy results. Anything malformed is
 * dropped rather than repaired, and ids are checked against what this agent was
 * actually shown so hallucinated UUIDs cannot reach the user.
 */
export function parseAgentResponse(raw: string, allowedIds: Set<string>): RelevanceResult[] {
  const jsonText = extractJsonArray(raw);
  if (!jsonText) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const seen = new Set<string>();
  const results: RelevanceResult[] = [];

  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;

    const noteId = typeof row.note_id === "string" ? row.note_id : null;
    if (!noteId || !allowedIds.has(noteId) || seen.has(noteId)) continue;

    const score = Number(row.relevance_score);
    if (!Number.isFinite(score) || score < SCORE_FLOOR) continue;

    const relationType = RELATION_TYPES.includes(row.relation_type as RelationType)
      ? (row.relation_type as RelationType)
      : "extends";

    const explanation = typeof row.explanation === "string" ? row.explanation.trim() : "";
    if (!explanation) continue;

    seen.add(noteId);
    results.push({
      note_id: noteId,
      relevance_score: Math.min(1, Math.max(0, score)),
      relation_type: relationType,
      explanation: truncate(explanation, MAX_EXPLANATION_CHARS),
    });
  }

  return results;
}

export interface AgentOutcome {
  chunkSize: number;
  /** null when the agent failed both attempts, so its notes went unread. */
  results: RelevanceResult[] | null;
}

/**
 * Combines the agents' verdicts into one ranked list, and reports how many
 * notes were actually read. A failed agent contributes nothing to the count,
 * which is what lets the UI tell the user coverage was incomplete instead of
 * quietly presenting a partial search as a complete one.
 */
export function mergeAgentResults(
  outcomes: AgentOutcome[],
  createdAtById: Map<string, string>,
  maxResults: number
): { results: RelevanceResult[]; notesSearched: number } {
  let notesSearched = 0;
  const merged = new Map<string, RelevanceResult>();

  for (const outcome of outcomes) {
    if (!outcome.results) continue;
    notesSearched += outcome.chunkSize;
    for (const result of outcome.results) {
      const existing = merged.get(result.note_id);
      if (!existing || result.relevance_score > existing.relevance_score) {
        merged.set(result.note_id, result);
      }
    }
  }

  const results = Array.from(merged.values())
    .sort(
      (a, b) =>
        b.relevance_score - a.relevance_score ||
        (createdAtById.get(b.note_id) ?? "").localeCompare(createdAtById.get(a.note_id) ?? "")
    )
    .slice(0, maxResults);

  return { results, notesSearched };
}
