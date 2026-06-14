alter table public.game_sessions
add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists game_sessions_user_idx
on public.game_sessions(user_id, created_at desc);

create unique index if not exists game_sessions_one_active_user_idx
on public.game_sessions(user_id, problem_id)
where status = 'in_progress' and user_id is not null;
