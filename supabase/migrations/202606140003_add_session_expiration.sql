alter table public.game_sessions
add column if not exists expires_at timestamptz;

update public.game_sessions
set expires_at = started_at + interval '20 minutes'
where expires_at is null;

alter table public.game_sessions
alter column expires_at set default (now() + interval '20 minutes'),
alter column expires_at set not null;

create index if not exists game_sessions_expiration_idx
on public.game_sessions(status, expires_at)
where status = 'in_progress';
