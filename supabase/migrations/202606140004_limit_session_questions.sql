update public.game_sessions
set question_count = 30
where question_count > 30;

alter table public.game_sessions
drop constraint if exists game_sessions_question_count_check;

alter table public.game_sessions
add constraint game_sessions_question_count_check
check (question_count between 0 and 30);
