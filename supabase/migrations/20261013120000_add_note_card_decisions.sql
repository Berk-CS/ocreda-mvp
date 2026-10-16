/*
  # Card decisions

  What a person chose on a suggestion card: Solved, Merge, Today stands, and
  so on. A choice is drawn over the note and never written into its text, so it
  lives here rather than in notes.raw_text, and it follows the person to every
  device. One row per card per note; deleting a note deletes its rows.

  `note_id` is the note the card was shown on. `target_note_id`, when set, is
  another note the choice also marks: when the note being read answers a
  problem in an earlier note, Solved puts the Solution box on that earlier note.

  `insight` keeps the card as it was when the person chose, so their choice
  still shows after a later search returns different cards.
*/

create table if not exists public.note_card_decisions (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  card_id text not null check (char_length(card_id) between 1 and 120),
  choice text not null check (choice in ('solved', 'downgraded', 'helped', 'merged', 'today', 'earlier', 'both', 'confirmed', 'rejected')),
  kind text not null check (kind in ('contradiction', 'solution', 'helps', 'extension', 'insight')),
  insight jsonb not null check (jsonb_typeof(insight) = 'object' and pg_column_size(insight) <= 32768),
  text text check (text is null or char_length(text) <= 4000),
  target_note_id uuid references public.notes(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, note_id, card_id)
);

-- Opening a note reads the choices made on it and the ones other notes made for it.
create index if not exists note_card_decisions_target_idx
  on public.note_card_decisions (user_id, target_note_id)
  where target_note_id is not null;

drop trigger if exists note_card_decisions_set_updated_at on public.note_card_decisions;
create trigger note_card_decisions_set_updated_at
  before update on public.note_card_decisions
  for each row execute function public.set_workspace_updated_at();

alter table public.note_card_decisions enable row level security;

create policy "Users can select own card decisions" on public.note_card_decisions
  for select to authenticated using (auth.uid() = user_id);

-- Both notes a row names must be the person's own.
create policy "Users can insert own card decisions" on public.note_card_decisions
  for insert to authenticated with check (
    auth.uid() = user_id
    and exists (select 1 from public.notes note where note.id = note_id and note.user_id = auth.uid())
    and (target_note_id is null or exists (select 1 from public.notes note where note.id = target_note_id and note.user_id = auth.uid()))
  );

create policy "Users can update own card decisions" on public.note_card_decisions
  for update to authenticated using (auth.uid() = user_id) with check (
    auth.uid() = user_id
    and exists (select 1 from public.notes note where note.id = note_id and note.user_id = auth.uid())
    and (target_note_id is null or exists (select 1 from public.notes note where note.id = target_note_id and note.user_id = auth.uid()))
  );

create policy "Users can delete own card decisions" on public.note_card_decisions
  for delete to authenticated using (auth.uid() = user_id);
