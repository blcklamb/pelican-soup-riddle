alter table public.problems
add column if not exists source_url text;

drop function if exists public.publish_generated_daily_problem(
  date, text, text, text, text, text[], text, text
);

create or replace function public.publish_generated_daily_problem(
  p_release_date date,
  p_title text,
  p_question text,
  p_answer text,
  p_explanation text,
  p_answer_keywords text[],
  p_category text,
  p_difficulty text,
  p_is_released boolean
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
    title, question, answer, explanation, answer_keywords,
    category, difficulty, source
  ) values (
    p_title, p_question, p_answer, p_explanation, p_answer_keywords,
    p_category, p_difficulty, 'AI'
  )
  returning id into created_problem_id;

  insert into public.daily_releases (
    release_date, problem_id, is_released
  ) values (
    p_release_date, created_problem_id, p_is_released
  );

  return created_problem_id;
end;
$$;

revoke all on function public.publish_generated_daily_problem(
  date, text, text, text, text, text[], text, text, boolean
) from public, anon, authenticated;
grant execute on function public.publish_generated_daily_problem(
  date, text, text, text, text, text[], text, text, boolean
) to service_role;

create or replace function public.release_scheduled_daily_problem(
  p_release_date date
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  released_count integer;
begin
  update public.daily_releases
  set is_released = true
  where release_date = p_release_date
    and is_released = false;

  get diagnostics released_count = row_count;
  return released_count;
end;
$$;

revoke all on function public.release_scheduled_daily_problem(date)
  from public, anon, authenticated;
grant execute on function public.release_scheduled_daily_problem(date)
  to service_role;

create or replace function public.publish_curated_daily_problem(
  p_release_date date,
  p_title text,
  p_question text,
  p_answer text,
  p_explanation text,
  p_answer_keywords text[],
  p_category text,
  p_difficulty text,
  p_source text,
  p_source_url text,
  p_is_released boolean
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  created_problem_id uuid;
begin
  if p_source not in ('Manual', 'Web') then
    raise exception 'Curated source must be Manual or Web';
  end if;

  if exists (
    select 1 from public.daily_releases
    where release_date = p_release_date
  ) then
    raise exception 'A daily problem already exists for %', p_release_date
      using errcode = '23505';
  end if;

  insert into public.problems (
    title, question, answer, explanation, answer_keywords,
    category, difficulty, source, source_url
  ) values (
    p_title, p_question, p_answer, p_explanation, p_answer_keywords,
    p_category, p_difficulty, p_source, nullif(p_source_url, '')
  )
  returning id into created_problem_id;

  insert into public.daily_releases (
    release_date, problem_id, is_released
  ) values (
    p_release_date, created_problem_id, p_is_released
  );

  return created_problem_id;
end;
$$;

revoke all on function public.publish_curated_daily_problem(
  date, text, text, text, text, text[], text, text, text, text, boolean
) from public, anon, authenticated;
grant execute on function public.publish_curated_daily_problem(
  date, text, text, text, text, text[], text, text, text, text, boolean
) to service_role;
