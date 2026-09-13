import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, generateWithGemini, isRetryableGeminiError } from "../_shared/gemini.ts";
import {
  condenseDraft,
  mergeAgentResults,
  runRelevanceAgents,
  streamRelevanceSearch,
  DEFAULT_AGENT_CONCURRENCY,
  DEFAULT_AGENT_COUNT,
  MIN_DRAFT_CHARS,
  type NoteLike,
} from "../_shared/relevance.ts";

const MAX_NOTES = 1000;
const MAX_RESULTS = 50;

const AGENT_SYSTEM_PROMPT =
  "You identify meaningful relationships between a person's notes. You respond with a JSON array and nothing else.";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // The caller's own JWT scopes every read below through RLS. The user id is
    // never read from the request body, so a caller cannot fetch someone else's
    // notes by passing a different id.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization header" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Invalid or expired session" }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => null);
    const draftText = typeof body?.draft_text === "string" ? body.draft_text.trim() : "";
    const excludeNoteId = typeof body?.exclude_note_id === "string" ? body.exclude_note_id : null;

    if (draftText.length < MIN_DRAFT_CHARS) {
      return json({ error: "Write a little more before searching for related notes." }, 400);
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return json({ error: "Relevance search is not configured." }, 500);

    let query = supabase
      .from("notes")
      .select("id, raw_text, summary, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(MAX_NOTES);
    if (excludeNoteId) query = query.neq("id", excludeNoteId);

    const { data, error: notesErr } = await query;
    if (notesErr) throw notesErr;

    const notes = (data ?? []) as NoteLike[];
    if (notes.length === 0) {
      return json({
        results: [],
        coverage: { notes_searched: 0, notes_total: 0, complete: true },
      });
    }

    const agentOptions = {
      draft: condenseDraft(draftText),
      notes,
      agentCount: DEFAULT_AGENT_COUNT,
      concurrency: DEFAULT_AGENT_CONCURRENCY,
      isRetryable: isRetryableGeminiError,
      generate: (prompt: string) =>
        generateWithGemini(AGENT_SYSTEM_PROMPT, [{ role: "user", content: prompt }], apiKey, undefined, {
          responseMimeType: "application/json",
          temperature: 0.2,
        }),
    };

    // Callers that ask for it get progress as each agent finishes. Anyone who
    // doesn't still gets the single JSON response below.
    if (body?.stream === true) {
      const stream = streamRelevanceSearch({
        ...agentOptions,
        maxResults: MAX_RESULTS,
        allFailedMessage: "Relevance search is unavailable right now. Please try again.",
        failedMessage: "Relevance search failed. Please try again.",
        onError: (error) =>
          console.error("find-relevant-notes stream failed:", error instanceof Error ? error.message : error),
      });
      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
      });
    }

    const { outcomes } = await runRelevanceAgents(agentOptions);

    const createdAtById = new Map(notes.map((note) => [note.id, note.created_at]));
    const { results, notesSearched } = mergeAgentResults(outcomes, createdAtById, MAX_RESULTS);

    // Every agent failed: report an outage rather than an empty result set,
    // which would read as "nothing in your notes is related".
    if (notesSearched === 0) {
      return json({ error: "Relevance search is unavailable right now. Please try again." }, 502);
    }

    return json({
      results,
      coverage: {
        notes_searched: notesSearched,
        notes_total: notes.length,
        complete: notesSearched === notes.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("find-relevant-notes failed:", message);
    return json({ error: "Relevance search failed. Please try again." }, 500);
  }
});
