/*
  Correct the Gemini Embedding 2 lifecycle and ensure active-page duplicates
  never consume the normal Stage 3 candidate budget.
*/

alter table public.notes
  add column if not exists token_count_method text not null default 'estimate-4chars-v1';

create or replace function public.prepare_note_semantic_embedding()
returns trigger
language plpgsql
security invoker
set search_path = public, extensions
as $$
begin
  new.updated_at := now();
  new.character_count := char_length(coalesce(new.raw_text, ''));
  new.token_count := case
    when new.character_count = 0 then 0
    else greatest(1, ceil(new.character_count::numeric / 4)::integer)
  end;
  new.token_count_method := 'estimate-4chars-v1';

  if tg_op = 'INSERT' or new.raw_text is distinct from old.raw_text then
    new.semantic_embedding := null;
    new.embedding_provider := null;
    new.embedding_model := null;
    new.embedding_dimension := null;
    new.embedding_version := null;
    new.embedding_status := 'pending';
    new.embedding_error := null;
    new.embedding_attempts := 0;
    new.embedding_started_at := null;
    new.embedded_at := null;
    new.embedding_source_hash := null;
  end if;

  return new;
end;
$$;

/*
  The retrieval prefixes are part of the embedding space. Existing v1 vectors
  cannot be compared with correctly prefixed v2 query vectors, so queue them
  for the normal idempotent backfill worker.
*/
update public.notes
set
  semantic_embedding = null,
  embedding_status = 'pending',
  embedding_error = null,
  embedding_started_at = null,
  embedded_at = null,
  embedding_source_hash = null
where embedding_version is distinct from
  'google:gemini-embedding-2:768:retrieval-prefix-v2';

drop index if exists public.notes_embedding_backfill_idx;
create index notes_embedding_backfill_idx
  on public.notes (user_id, embedding_status, embedding_version, created_at)
  where embedding_status <> 'ready'
     or embedding_version is distinct from
       'google:gemini-embedding-2:768:retrieval-prefix-v2';

drop function if exists public.match_notes_semantic(
  extensions.vector,
  integer,
  double precision
);

create function public.match_notes_semantic(
  query_embedding extensions.vector(768),
  candidate_limit integer default 60,
  similarity_floor double precision default 0,
  duplicate_threshold double precision default 0.95
)
returns table (
  note_id uuid,
  similarity double precision,
  raw_rank bigint,
  note_length integer,
  token_count integer,
  raw_text text,
  embedding_text text,
  is_near_duplicate boolean
)
language plpgsql
security invoker
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if candidate_limit < 1 or candidate_limit > 60 then
    raise exception 'candidate_limit must be between 1 and 60';
  end if;
  if similarity_floor < -1 or similarity_floor > 1 then
    raise exception 'similarity_floor must be between -1 and 1';
  end if;
  if duplicate_threshold < 0.8 or duplicate_threshold > 1 then
    raise exception 'duplicate_threshold must be between 0.8 and 1';
  end if;

  return query
  with eligible as materialized (
    select
      note.id as note_id,
      1 - (note.semantic_embedding <=> query_embedding) as similarity,
      note.semantic_embedding <=> query_embedding as distance,
      note.character_count as note_length,
      note.token_count,
      note.raw_text,
      note.semantic_embedding::text as embedding_text
    from public.notes note
    where note.user_id = auth.uid()
      and note.embedding_status = 'ready'
      and note.embedding_version =
        'google:gemini-embedding-2:768:retrieval-prefix-v2'
      and note.semantic_embedding is not null
      and 1 - (note.semantic_embedding <=> query_embedding) >= similarity_floor
  ),
  duplicate_total as (
    select count(*)::bigint as total
    from eligible
    where eligible.similarity >= duplicate_threshold
  ),
  near_duplicates as (
    select
      duplicate.note_id,
      duplicate.similarity,
      row_number() over (order by duplicate.distance, duplicate.note_id) as raw_rank,
      duplicate.note_length,
      duplicate.token_count,
      duplicate.raw_text,
      duplicate.embedding_text,
      true as is_near_duplicate
    from eligible duplicate
    where duplicate.similarity >= duplicate_threshold
    order by duplicate.distance, duplicate.note_id
    limit candidate_limit
  ),
  normal_candidates as (
    select
      candidate.note_id,
      candidate.similarity,
      duplicate_total.total +
        row_number() over (order by candidate.distance, candidate.note_id) as raw_rank,
      candidate.note_length,
      candidate.token_count,
      candidate.raw_text,
      candidate.embedding_text,
      false as is_near_duplicate
    from eligible candidate
    cross join duplicate_total
    where candidate.similarity < duplicate_threshold
    order by candidate.distance, candidate.note_id
    limit candidate_limit
  )
  select combined.*
  from (
    select * from near_duplicates
    union all
    select * from normal_candidates
  ) as combined
  order by combined.raw_rank, combined.note_id;
end;
$$;

revoke all on function public.match_notes_semantic(
  extensions.vector,
  integer,
  double precision,
  double precision
) from public;
grant execute on function public.match_notes_semantic(
  extensions.vector,
  integer,
  double precision,
  double precision
) to authenticated;
