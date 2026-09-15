# `dev/` — local mode

Runs the app with **no Supabase at all**, so the note editor and "Find relevant
notes" can be exercised without credentials, Docker, or a deployed Edge
Function. Development only.

Everything here is inert unless `NEXT_PUBLIC_LOCAL_MODE=1` is set in
`.env.local`. Without that flag every branch is false and the API route returns
404, so this cannot leak into a real deployment.

## Running it

```
# .env.local
NEXT_PUBLIC_LOCAL_MODE=1
GEMINI_API_KEY=your-key-here
```

Then `npm run dev`. No Supabase URL or anon key is needed.

## What it swaps out

| Real path | Local path |
|---|---|
| Supabase Auth | a fake signed-in user (`LOCAL_USER`) |
| `notes` table in Postgres | `localStorage`, key `ocreda-local-notes` |
| `find-relevant-notes` Edge Function | `app/api/find-relevant-notes` → `local-relevance-route.ts` |

The relevance search runs the **same** fan-out as production — it imports
`supabase/functions/_shared/relevance.ts` directly. The only difference is that
notes arrive in the request body, because there is no database for the server
to read them from.

## What does not work in local mode

- PDF, Office, and image import (needs the `extract-document` function). Plain
  text — `.txt`, `.md`, `.csv`, `.json`, `.xml` — works, since those are parsed
  in the browser.
- The chat / Q&A surfaces (`handle-message`, `chat-message`, guided notes).
- `note_relations`, so the accept/reject connection learning is inert.
- Notes live in one browser profile. Clearing site data deletes them.

## Removing it

Two deletes and one grep:

```bash
rm -rf dev app/api/find-relevant-notes
grep -rn "DEV-LOCAL-MODE" app lib
```

The grep lists every remaining line — 20 of them, across four files. Each is a
single self-contained line; delete the whole line in every case except these
three, which need their original value restored rather than removal:

- `lib/supabase.ts` — the two `||  (IS_LOCAL_MODE ? ... : '')` fallbacks go back
  to plain `process.env.NEXT_PUBLIC_SUPABASE_URL!` / `..._ANON_KEY!`
- `lib/auth-context.tsx` — `useState(!IS_LOCAL_MODE)` goes back to
  `useState(true)`, and the `useState<User | null>(...)` back to `null`

Then drop `NEXT_PUBLIC_LOCAL_MODE` from `.env.local`.

Nothing outside those two directories and 20 lines is local-mode code. The
`scripts/` helpers and `supabase/functions/_shared/relevance.ts` are not part of
this — they are used by the real Edge Function too.
