alter table public.game_sessions
add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists game_sessions_user_idx
on public.game_sessions(user_id, created_at desc);

create unique index if not exists game_sessions_one_active_user_idx
on public.game_sessions(user_id, problem_id)
where status = 'in_progress' and user_id is not null;

create or replace function public.claim_device_sessions(p_user_id uuid, p_device_id uuid)
returns integer language plpgsql security invoker set search_path = public as $$
declare claimed_count integer := 0; updated_count integer;
begin
  update public.game_sessions
  set user_id = p_user_id
  where device_id = p_device_id and user_id is null and status <> 'in_progress';
  get diagnostics updated_count = row_count;
  claimed_count := claimed_count + updated_count;

  update public.game_sessions target
  set user_id = p_user_id
  where target.device_id = p_device_id
    and target.user_id is null
    and target.status = 'in_progress'
    and not exists (
      select 1 from public.game_sessions existing
      where existing.user_id = p_user_id
        and existing.problem_id = target.problem_id
        and existing.status = 'in_progress'
    );
  get diagnostics updated_count = row_count;
  return claimed_count + updated_count;
end; $$;

revoke all on function public.claim_device_sessions(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_device_sessions(uuid, uuid) to service_role;
