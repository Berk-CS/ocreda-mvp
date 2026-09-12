import { NextResponse } from 'next/server';
import {
  condenseDraft,
  mergeAgentResults,
  runRelevanceAgents,
  DEFAULT_AGENT_CONCURRENCY,
  DEFAULT_AGENT_COUNT,
  MIN_DRAFT_CHARS,
  type NoteLike,
} from '@/supabase/functions/_shared/relevance';
import { generateWithGemini, isRetryableGeminiError } from '@/supabase/functions/_shared/gemini';

/**
 * Development-only stand-in for the find-relevant-notes Edge Function, so the
 * UI can be exercised without Supabase. It runs the identical fan-out from
 * _shared/relevance.ts; the only difference is that the notes arrive in the
 * request body rather than being read from the database, because in local mode
 * they live in the browser.
 *
 * This route has no authentication, so it refuses to run unless local mode is
 * explicitly enabled — otherwise a deployment would expose an open endpoint
 * that spends your Gemini quota.
 */


const MAX_RESULTS = 50;
const MAX_NOTES = 1000;

const AGENT_SYSTEM_PROMPT =
  "You identify meaningful relationships between a person's notes. You respond with a JSON array and nothing else.";

function isNoteLike(value: unknown): value is NoteLike {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && typeof row.raw_text === 'string';
}

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_LOCAL_MODE !== '1') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Set GEMINI_API_KEY in .env.local, then restart the dev server.' },
      { status: 500 }
    );
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const draftText = typeof body?.draft_text === 'string' ? body.draft_text.trim() : '';
  if (draftText.length < MIN_DRAFT_CHARS) {
    return NextResponse.json({ error: 'Write a little more before searching for related notes.' }, { status: 400 });
  }

  const notes = (body && Array.isArray(body.notes) ? body.notes : [])
    .filter(isNoteLike)
    .slice(0, MAX_NOTES)
    .map((note) => ({
      id: note.id,
      raw_text: note.raw_text,
      summary: note.summary ?? null,
      created_at: note.created_at ?? new Date().toISOString(),
    }));

  if (notes.length === 0) {
    return NextResponse.json({
      results: [],
      coverage: { notes_searched: 0, notes_total: 0, complete: true },
    });
  }

  try {
    const { outcomes } = await runRelevanceAgents({
      draft: condenseDraft(draftText),
      notes,
      agentCount: DEFAULT_AGENT_COUNT,
      concurrency: DEFAULT_AGENT_CONCURRENCY,
      isRetryable: isRetryableGeminiError,
      generate: (prompt) =>
        generateWithGemini(AGENT_SYSTEM_PROMPT, [{ role: 'user', content: prompt }], apiKey, undefined, {
          responseMimeType: 'application/json',
          temperature: 0.2,
        }),
    });

    const createdAtById = new Map(notes.map((note) => [note.id, note.created_at]));
    const { results, notesSearched } = mergeAgentResults(outcomes, createdAtById, MAX_RESULTS);

    if (notesSearched === 0) {
      return NextResponse.json(
        { error: 'Every agent failed — check your GEMINI_API_KEY and the terminal output.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      results,
      coverage: {
        notes_searched: notesSearched,
        notes_total: notes.length,
        complete: notesSearched === notes.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[local] find-relevant-notes failed:', message);
    return NextResponse.json({ error: `Relevance search failed: ${message}` }, { status: 500 });
  }
}
