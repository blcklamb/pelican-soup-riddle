create extension if not exists pgcrypto;

create table public.problems (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  question text not null,
  answer text not null,
  explanation text not null,
  answer_keywords text[] not null default '{}',
  category text not null check (category in ('Paradox', 'Weird', 'Logic', 'Mystery')),
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  source text not null default 'Manual' check (source in ('Manual', 'AI', 'Web')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.daily_releases (
  id uuid primary key default gen_random_uuid(),
  release_date date unique not null,
  problem_id uuid not null references public.problems(id) on delete cascade,
  is_released boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null,
  problem_id uuid not null references public.problems(id) on delete restrict,
  conversation_history jsonb not null default '[]'::jsonb,
  status text not null default 'in_progress' check (status in ('in_progress', 'solved', 'given_up')),
  question_count integer not null default 0 check (question_count >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index problems_created_at_idx on public.problems(created_at desc);
create index daily_releases_public_idx on public.daily_releases(is_released, release_date desc);
create index game_sessions_device_idx on public.game_sessions(device_id, created_at desc);
create index game_sessions_problem_idx on public.game_sessions(problem_id);
create unique index game_sessions_one_active_idx
  on public.game_sessions(device_id, problem_id)
  where status = 'in_progress';

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger problems_updated_at before update on public.problems
for each row execute function public.set_updated_at();
create trigger releases_updated_at before update on public.daily_releases
for each row execute function public.set_updated_at();
create trigger sessions_updated_at before update on public.game_sessions
for each row execute function public.set_updated_at();

alter table public.problems enable row level security;
alter table public.daily_releases enable row level security;
alter table public.game_sessions enable row level security;

create policy "Public released problem metadata" on public.problems
for select using (
  exists (
    select 1 from public.daily_releases dr
    where dr.problem_id = problems.id
      and dr.is_released = true
      and dr.release_date <= current_date
  )
);
create policy "Public release calendar" on public.daily_releases
for select using (is_released = true and release_date <= current_date);

revoke all on public.game_sessions from anon, authenticated;
revoke select (answer, explanation, answer_keywords) on public.problems from anon, authenticated;
