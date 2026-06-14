alter table public.problems
add column if not exists hint_1 text,
add column if not exists hint_2 text;

alter table public.game_sessions
add column if not exists hint_count integer not null default 0
check (hint_count between 0 and 2);

drop function if exists public.publish_generated_daily_problem(date, text, text, text, text, text[], text, text, boolean);

create function public.publish_generated_daily_problem(
  p_release_date date, p_title text, p_question text, p_answer text,
  p_explanation text, p_answer_keywords text[], p_category text,
  p_difficulty text, p_is_released boolean, p_hint_1 text, p_hint_2 text
) returns uuid language plpgsql security invoker set search_path = public as $$
declare created_problem_id uuid;
begin
  if exists (select 1 from public.daily_releases where release_date = p_release_date) then
    raise exception 'A daily problem already exists for %', p_release_date using errcode = '23505';
  end if;
  insert into public.problems(title, question, answer, explanation, answer_keywords, category, difficulty, source, hint_1, hint_2)
  values(p_title, p_question, p_answer, p_explanation, p_answer_keywords, p_category, p_difficulty, 'AI', p_hint_1, p_hint_2)
  returning id into created_problem_id;
  insert into public.daily_releases(release_date, problem_id, is_released)
  values(p_release_date, created_problem_id, p_is_released);
  return created_problem_id;
end; $$;

revoke all on function public.publish_generated_daily_problem(date, text, text, text, text, text[], text, text, boolean, text, text) from public, anon, authenticated;
grant execute on function public.publish_generated_daily_problem(date, text, text, text, text, text[], text, text, boolean, text, text) to service_role;
