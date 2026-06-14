alter table public.game_sessions
add column if not exists extension_count integer not null default 0
check (extension_count between 0 and 1);

create table if not exists public.api_rate_limits (
  key text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1,
  primary key (key, window_started_at)
);

create index if not exists api_rate_limits_window_idx
on public.api_rate_limits(window_started_at);

alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from public, anon, authenticated;

create or replace function public.consume_api_rate_limit(
  p_key text,
  p_window_seconds integer,
  p_limit integer
)
returns table(allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_window timestamptz;
  current_count integer;
begin
  if p_window_seconds <= 0 or p_limit <= 0 then
    raise exception 'Rate limit values must be positive';
  end if;

  current_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.api_rate_limits(key, window_started_at, request_count)
  values (p_key, current_window, 1)
  on conflict (key, window_started_at)
  do update set request_count = public.api_rate_limits.request_count + 1
  returning request_count into current_count;

  return query select
    current_count <= p_limit,
    greatest(0, p_limit - current_count),
    greatest(
      1,
      ceil(
        extract(epoch from current_window + make_interval(secs => p_window_seconds) - now())
      )::integer
    );
end;
$$;

revoke all on function public.consume_api_rate_limit(text, integer, integer)
from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer)
to service_role;
