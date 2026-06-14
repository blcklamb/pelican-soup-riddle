alter table public.problems
add column if not exists moderation_status text not null default 'active'
check (moderation_status in ('active', 'review', 'suspended'));

create table public.problem_feedback (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  device_id uuid not null,
  fun_rating integer not null check (fun_rating between 1 and 5),
  difficulty_rating integer not null check (difficulty_rating between 1 and 5),
  fairness_rating integer not null check (fairness_rating between 1 and 5),
  report_reason text check (report_reason in ('incorrect_answer', 'ambiguous', 'offensive', 'copyright')),
  comment text check (char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id)
);

create index problem_feedback_problem_idx
on public.problem_feedback(problem_id, created_at desc);
create index problem_feedback_user_idx
on public.problem_feedback(user_id, created_at desc)
where user_id is not null;

create trigger problem_feedback_updated_at before update on public.problem_feedback
for each row execute function public.set_updated_at();

alter table public.problem_feedback enable row level security;
revoke all on public.problem_feedback from public, anon, authenticated;

create or replace view public.problem_feedback_summary
with (security_invoker = true)
as
select
  p.id as problem_id,
  p.title,
  p.moderation_status,
  count(f.id) as feedback_count,
  count(f.report_reason) as report_count,
  round(avg(f.fun_rating), 2) as average_fun,
  round(avg(f.difficulty_rating), 2) as average_difficulty,
  round(avg(f.fairness_rating), 2) as average_fairness
from public.problems p
left join public.problem_feedback f on f.problem_id = p.id
group by p.id, p.title, p.moderation_status;

revoke all on public.problem_feedback_summary from public, anon, authenticated;
grant select on public.problem_feedback_summary to service_role;
