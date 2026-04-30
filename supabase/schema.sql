-- Voice Scribe — schema for lessons with attached files (media + PDFs).
-- Run this once in Supabase SQL Editor (Dashboard -> SQL).
-- Safe to re-run: uses IF NOT EXISTS / on conflict everywhere.

-- 1. Lessons table
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null check (kind in ('audio', 'video')),
  created_at timestamptz not null default now(),
  lesson_date date generated always as ((created_at at time zone 'UTC')::date) stored,
  duration_ms integer not null default 0,
  transcript text not null default '',
  segments jsonb not null default '[]'::jsonb,

  -- Media (audio or video)
  media_path text,
  media_mime text,
  media_extension text,
  media_size bigint not null default 0,

  -- AI-polished PDFs
  pdf_full_path text,
  pdf_full_size bigint not null default 0,
  pdf_summary_path text,
  pdf_summary_size bigint not null default 0
);

-- For older databases that already have lessons table without PDF columns
alter table public.lessons add column if not exists pdf_full_path text;
alter table public.lessons add column if not exists pdf_full_size bigint not null default 0;
alter table public.lessons add column if not exists pdf_summary_path text;
alter table public.lessons add column if not exists pdf_summary_size bigint not null default 0;
alter table public.lessons add column if not exists lesson_date date generated always as ((created_at at time zone 'UTC')::date) stored;

create index if not exists lessons_created_at_idx on public.lessons (created_at desc);
create index if not exists lessons_lesson_date_idx on public.lessons (lesson_date desc);

-- 2. Row Level Security (open access — switch to auth-scoped policies later)
alter table public.lessons enable row level security;

drop policy if exists "lessons read"   on public.lessons;
drop policy if exists "lessons insert" on public.lessons;
drop policy if exists "lessons update" on public.lessons;
drop policy if exists "lessons delete" on public.lessons;

create policy "lessons read"   on public.lessons for select using (true);
create policy "lessons insert" on public.lessons for insert with check (true);
create policy "lessons update" on public.lessons for update using (true) with check (true);
create policy "lessons delete" on public.lessons for delete using (true);

-- 3. Storage bucket for media + PDFs
-- 5 GB per file (effective limit depends on Supabase plan: 50 MB on free, up to 5 GB on Pro).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-media',
  'lesson-media',
  true,
  5368709120,
  array[
    'audio/webm','audio/ogg','audio/mpeg','audio/mp4','audio/x-m4a','audio/wav',
    'video/webm','video/mp4',
    'application/pdf'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 4. Storage policies (public read + open write/delete on this bucket only)
drop policy if exists "media read"   on storage.objects;
drop policy if exists "media insert" on storage.objects;
drop policy if exists "media delete" on storage.objects;

create policy "media read"
  on storage.objects for select
  using (bucket_id = 'lesson-media');

create policy "media insert"
  on storage.objects for insert
  with check (bucket_id = 'lesson-media');

create policy "media delete"
  on storage.objects for delete
  using (bucket_id = 'lesson-media');

-- 5. Convenience view: lessons grouped by day
create or replace view public.lessons_by_day as
select
  lesson_date,
  count(*) as lesson_count,
  sum(duration_ms) as total_duration_ms,
  sum(media_size + pdf_full_size + pdf_summary_size) as total_bytes
from public.lessons
group by lesson_date
order by lesson_date desc;
