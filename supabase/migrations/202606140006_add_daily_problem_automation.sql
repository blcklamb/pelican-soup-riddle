create table public.problem_generation_runs (
  id uuid primary key default gen_random_uuid(),
  target_date date not null,
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed')),
  attempts integer not null default 0 check (attempts between 0 and 5),
  problem_id uuid references public.problems(id) on delete set null,
  review_score integer check (review_score between 0 and 100),
  message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index problem_generation_runs_date_idx
  on public.problem_generation_runs(target_date desc, created_at desc);

create unique index problem_generation_one_running_idx
  on public.problem_generation_runs(target_date)
  where status = 'running';

alter table public.problem_generation_runs enable row level security;
revoke all on public.problem_generation_runs from anon, authenticated;

create or replace function public.publish_generated_daily_problem(
  p_release_date date,
  p_title text,
  p_question text,
  p_answer text,
  p_explanation text,
  p_answer_keywords text[],
  p_category text,
  p_difficulty text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  created_problem_id uuid;
begin
  if exists (
    select 1 from public.daily_releases
    where release_date = p_release_date
  ) then
    raise exception 'A daily problem already exists for %', p_release_date
      using errcode = '23505';
  end if;

  insert into public.problems (
    title,
    question,
    answer,
    explanation,
    answer_keywords,
    category,
    difficulty,
    source
  ) values (
    p_title,
    p_question,
    p_answer,
    p_explanation,
    p_answer_keywords,
    p_category,
    p_difficulty,
    'AI'
  )
  returning id into created_problem_id;

  insert into public.daily_releases (
    release_date,
    problem_id,
    is_released
  ) values (
    p_release_date,
    created_problem_id,
    true
  );

  return created_problem_id;
end;
$$;

revoke all on function public.publish_generated_daily_problem(
  date, text, text, text, text, text[], text, text
) from public, anon, authenticated;
grant execute on function public.publish_generated_daily_problem(
  date, text, text, text, text, text[], text, text
) to service_role;
