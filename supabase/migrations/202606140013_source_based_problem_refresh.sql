drop function if exists public.publish_curated_daily_problem(
  date, text, text, text, text, text[], text, text, text, text, boolean
);

drop function if exists public.publish_curated_daily_problem(
  date, text, text, text, text, text[], text, text, text, text, boolean, text, text
);

create function public.publish_curated_daily_problem(
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
  p_is_released boolean,
  p_hint_1 text,
  p_hint_2 text
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
  if p_source = 'Web' and nullif(p_source_url, '') is null then
    raise exception 'Web curated problem requires source_url';
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
    category, difficulty, source, source_url, hint_1, hint_2
  ) values (
    p_title, p_question, p_answer, p_explanation, p_answer_keywords,
    p_category, p_difficulty, p_source, nullif(p_source_url, ''),
    p_hint_1, p_hint_2
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
  date, text, text, text, text, text[], text, text, text, text, boolean, text, text
) from public, anon, authenticated;
grant execute on function public.publish_curated_daily_problem(
  date, text, text, text, text, text[], text, text, text, text, boolean, text, text
) to service_role;

-- Remove AI-authored or legacy generated problems only when no session depends on them,
-- then fill the daily schedule with source-backed rewritten problems.
delete from public.daily_releases dr
where dr.release_date between '2026-06-22' and '2026-07-19'
  and not exists (
    select 1 from public.game_sessions gs
    where gs.problem_id = dr.problem_id
  );

delete from public.problems p
where not exists (
    select 1 from public.game_sessions gs
    where gs.problem_id = p.id
  )
  and (
    p.source = 'AI'
    or p.id between '10000000-0000-4000-8000-000000000001'::uuid
      and '10000000-0000-4000-8000-000000000010'::uuid
  );

with curated as (
  select *
  from jsonb_to_recordset($curated$
[
  {
    "id": "20000000-0000-4000-8000-000000000001",
    "releaseDate": "2026-06-22",
    "title": "물 한 잔 대신 비명",
    "question": "한 손님이 술집에 들어와 물 한 잔을 달라고 했다. 바텐더는 물을 따르지 않고 갑자기 큰 소리를 냈다. 손님은 고맙다고 말하고 물을 마시지 않은 채 나갔다. 왜 그랬을까?",
    "answer": "손님은 목이 마른 것이 아니라 딸꾹질을 멈추려고 물을 찾았다. 바텐더는 그 목적을 알아채고 손님을 놀라게 해 딸꾹질을 멈추게 했다.",
    "explanation": "손님이 원한 것은 물 자체가 아니라 증상을 멈추는 효과였다. 큰 소리가 그 역할을 대신했기 때문에 물은 더 필요하지 않았다.",
    "answerKeywords": [
      "딸꾹질",
      "놀람",
      "물",
      "목마름 아님"
    ],
    "category": "Paradox",
    "difficulty": "Easy",
    "hint1": "손님이 정말 물을 마시고 싶었는지부터 의심해 보세요.",
    "hint2": "바텐더의 행동은 공격이 아니라 즉석 처방에 가까웠습니다.",
    "source": "Web",
    "sourceUrl": "https://en.wikipedia.org/wiki/Situation_puzzle"
  },
  {
    "id": "20000000-0000-4000-8000-000000000002",
    "releaseDate": "2026-06-23",
    "title": "빨리 마신 아이스티",
    "question": "두 사람이 같은 식당에서 같은 아이스티를 주문했다. 한 사람은 천천히 한 잔을 마시고 죽었고, 다른 사람은 빠르게 여러 잔을 마셨지만 무사했다. 조사 결과 모든 잔에는 같은 독이 있었다. 왜 이런 차이가 났을까?",
    "answer": "독은 음료가 아니라 얼음 안에 있었다. 여러 잔을 빠르게 마신 사람은 얼음이 거의 녹기 전에 마쳤고, 천천히 마신 사람은 독이 녹아 나온 음료를 마셨다.",
    "explanation": "두 사람이 받은 음료는 같았지만 시간이 달랐다. 얼음이 녹는 속도가 실제 독의 양을 결정했다.",
    "answerKeywords": [
      "얼음",
      "독",
      "녹다",
      "천천히 마심"
    ],
    "category": "Mystery",
    "difficulty": "Easy",
    "hint1": "독이 처음부터 액체 전체에 섞여 있었다고 단정하지 마세요.",
    "hint2": "두 사람이 다르게 행동한 것은 마신 양보다 마신 속도입니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/2980/poisoned-iced-tea"
  },
  {
    "id": "20000000-0000-4000-8000-000000000003",
    "releaseDate": "2026-06-24",
    "title": "비 오는 날의 20층",
    "question": "한 남자는 매일 엘리베이터를 타고 집에 간다. 맑은 날에는 12층에서 내려 남은 층을 걸어 올라가지만, 비 오는 날에는 곧장 20층까지 올라간다. 엘리베이터는 고장 난 적이 없다. 왜 그럴까?",
    "answer": "남자는 키가 작아 평소에는 20층 버튼에 손이 닿지 않고 12층 버튼까지만 누를 수 있다. 비 오는 날에는 우산 끝으로 20층 버튼을 누를 수 있다.",
    "explanation": "날씨가 엘리베이터를 바꾼 것이 아니라 남자가 가진 도구를 바꿨다. 우산이 손이 닿지 않는 버튼을 대신 눌러 주었다.",
    "answerKeywords": [
      "키가 작다",
      "우산",
      "엘리베이터 버튼",
      "20층"
    ],
    "category": "Logic",
    "difficulty": "Easy",
    "hint1": "비가 오는 날 남자에게 새로 생기는 물건을 생각해 보세요.",
    "hint2": "층수 차이는 엘리베이터 성능이 아니라 버튼에 닿는 문제입니다.",
    "source": "Web",
    "sourceUrl": "https://en.wikipedia.org/wiki/Situation_puzzle"
  },
  {
    "id": "20000000-0000-4000-8000-000000000004",
    "releaseDate": "2026-06-25",
    "title": "호텔 앞에서 잃은 전 재산",
    "question": "한 남자가 자동차를 밀고 호텔 앞에 도착했다. 그는 호텔 안에 들어가지도 않았는데 곧바로 전 재산을 잃었다. 차는 고장 나지 않았고 남자는 강도를 당하지도 않았다. 무슨 일이었을까?",
    "answer": "그는 보드게임을 하고 있었다. 자동차와 호텔은 현실의 차와 건물이 아니라 게임판 위의 말과 칸이었고, 호텔이 있는 칸에 도착해 큰 비용을 내야 했다.",
    "explanation": "상황의 단어를 현실로 해석하면 이상하지만, 보드게임 맥락에서는 자연스럽다. 남자가 잃은 전 재산은 게임 안의 돈이었다.",
    "answerKeywords": [
      "보드게임",
      "자동차 말",
      "호텔 칸",
      "게임 돈"
    ],
    "category": "Weird",
    "difficulty": "Easy",
    "hint1": "문제 속 자동차와 호텔이 현실의 물건인지 확인해 보세요.",
    "hint2": "남자가 잃은 재산도 현실 돈이 아닐 수 있습니다.",
    "source": "Web",
    "sourceUrl": "https://en.wikipedia.org/wiki/Situation_puzzle"
  },
  {
    "id": "20000000-0000-4000-8000-000000000005",
    "releaseDate": "2026-06-26",
    "title": "12층에서 알게 된 죽음",
    "question": "30층에 사는 남자는 아침마다 아내에게 인사하고 엘리베이터를 타고 출근했다. 어느 날도 모든 것이 평소와 같았지만, 엘리베이터가 12층에서 멈추자 그는 아무 연락도 받지 않고 아내가 곧 죽을 것을 알았다. 왜일까?",
    "answer": "아내는 집에서 전기로 작동하는 생명 유지 장치에 의존하고 있었다. 엘리베이터가 12층에서 멈춘 것은 건물 정전을 뜻했고, 남자는 위층의 장치도 멈췄음을 알았다.",
    "explanation": "엘리베이터의 정지는 직접적인 메시지는 아니지만 건물 전체 전력 문제의 신호였다. 그 신호가 아내의 상황과 연결되어 있었다.",
    "answerKeywords": [
      "정전",
      "생명 유지 장치",
      "엘리베이터 정지",
      "아내"
    ],
    "category": "Mystery",
    "difficulty": "Medium",
    "hint1": "엘리베이터가 멈춘 이유가 남자에게만 중요한 정보를 줍니다.",
    "hint2": "아내에게는 집 안 전기가 단순한 편의가 아니었습니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/11238/my-wife-has-died"
  },
  {
    "id": "20000000-0000-4000-8000-000000000006",
    "releaseDate": "2026-06-27",
    "title": "목숨을 구한 해고",
    "question": "한 경비원이 회장에게 오늘 비행기를 타면 사고가 날 것 같다고 말렸다. 회장은 일정을 취소했고, 실제로 그 비행기는 사고를 당했다. 회장은 목숨을 구했지만 경비원을 해고했다. 왜 그랬을까?",
    "answer": "경비원은 야간 근무 중 그 사고를 꿈으로 보았다고 말했다. 회장은 그가 근무 시간에 잠을 잤다는 사실을 알게 되어 해고했다.",
    "explanation": "경비원의 말은 결과적으로 도움이 되었지만, 그 정보의 출처가 근무 태만을 드러냈다. 회장은 사고 예언보다 근무 중 수면을 문제 삼았다.",
    "answerKeywords": [
      "꿈",
      "야간 근무",
      "잠",
      "해고"
    ],
    "category": "Paradox",
    "difficulty": "Easy",
    "hint1": "경비원이 그 정보를 어떻게 알았는지가 핵심입니다.",
    "hint2": "회장이 벌한 것은 예언이 틀려서가 아니라 근무 태도였습니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/31761/guard-gets-fired-after-saving-ceos-life"
  },
  {
    "id": "20000000-0000-4000-8000-000000000007",
    "releaseDate": "2026-06-28",
    "title": "버려진 1달러 물건",
    "question": "한 남자가 가게에서 1달러짜리 물건을 샀다. 그는 가게를 나오자마자 그 물건과 영수증을 쓰레기통에 버렸다. 그는 처음부터 그 물건을 원했고, 버린 행동도 합리적이었다. 무엇을 산 걸까?",
    "answer": "남자는 즉석 복권을 샀고 바로 긁어 보았다. 당첨되지 않았다는 것을 확인했기 때문에 복권과 영수증을 버렸다.",
    "explanation": "그가 원한 것은 종이 자체가 아니라 당첨 가능성이었다. 확인이 끝나자 물건의 가치는 사라졌다.",
    "answerKeywords": [
      "즉석 복권",
      "긁다",
      "낙첨",
      "버림"
    ],
    "category": "Logic",
    "difficulty": "Easy",
    "hint1": "그 물건은 사용한 뒤 바로 가치가 없어질 수 있습니다.",
    "hint2": "남자가 산 것은 오래 보관할 물건이 아니라 결과 확인의 기회였습니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/64123/man-buys-item-throws-it-away-on-his-way-out"
  },
  {
    "id": "20000000-0000-4000-8000-000000000008",
    "releaseDate": "2026-06-29",
    "title": "버튼 하나와 9킬로그램",
    "question": "한 남자가 방에 들어가 버튼 하나를 눌렀다. 몇 초 뒤 그는 실제 몸은 그대로인데 체중계가 가리키는 몸무게가 약 9킬로그램 줄었다. 어떤 방이었을까?",
    "answer": "그 방은 엘리베이터였다. 아래로 움직이기 시작할 때 순간적인 가속 때문에 체중계가 재는 겉보기 몸무게가 줄어들었다.",
    "explanation": "남자의 질량이 줄어든 것이 아니라 측정 환경이 바뀌었다. 엘리베이터의 가속이 체중계 수치를 낮게 만들었다.",
    "answerKeywords": [
      "엘리베이터",
      "아래로 가속",
      "겉보기 몸무게",
      "체중계"
    ],
    "category": "Logic",
    "difficulty": "Medium",
    "hint1": "몸 자체가 사라진 것이 아니라 측정값이 달라졌습니다.",
    "hint2": "버튼을 누른 뒤 방이 움직이기 시작했다고 생각해 보세요.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/72865/mysterious-loss-of-weight"
  },
  {
    "id": "20000000-0000-4000-8000-000000000009",
    "releaseDate": "2026-06-30",
    "title": "느리게 달릴 수 없는 차량",
    "question": "한 학생이 운전 교습 중 시속 60마일로 달리고 있었다. 뒤에 앉은 교관이 40마일로 줄이라고 했지만, 속도를 줄이자 차량은 심하게 흔들리며 다시 빨라질 수밖에 없었다. 엔진 고장은 아니었다. 어떤 차량이었을까?",
    "answer": "그 차량은 글라이더였다. 너무 느리게 날면 양력이 부족해 실속할 수 있어서 일정 속도 이하를 안정적으로 유지할 수 없었다.",
    "explanation": "문제는 도로 위 자동차를 떠올리게 하지만, 교관이 뒤에 앉은 비행 교습 상황이었다. 글라이더에는 엔진이 없고 속도는 안전한 비행 조건이다.",
    "answerKeywords": [
      "글라이더",
      "비행 교습",
      "실속",
      "양력"
    ],
    "category": "Mystery",
    "difficulty": "Medium",
    "hint1": "여기서 운전은 꼭 도로 위 운전이 아닐 수 있습니다.",
    "hint2": "느린 속도가 오히려 위험해지는 탈것을 떠올려 보세요.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/93093/what-was-this-unstoppable-vehicle"
  },
  {
    "id": "20000000-0000-4000-8000-000000000010",
    "releaseDate": "2026-07-01",
    "title": "추락 뒤 걸어 나온 조종사",
    "question": "맑은 날 한 조종사가 비행기를 날리고 있었다. 갑자기 날개가 떨어져 비행기는 빙글빙글 추락했고 산산조각 났다. 조종사는 탈출하지 않았지만 아무 상처 없이 걸어 나왔다. 어떻게 가능했을까?",
    "answer": "조종사는 실제 비행기 안에 탄 사람이 아니라 모형 비행기를 조종하던 사람이었다. 추락한 것은 장난감이나 모형 비행기였다.",
    "explanation": "조종사라는 말이 실제 항공기 탑승자를 뜻한다고 단정하면 모순이 생긴다. 여기서는 원격으로 모형을 조종한 사람을 가리켰다.",
    "answerKeywords": [
      "모형 비행기",
      "원격 조종",
      "탑승하지 않음",
      "추락"
    ],
    "category": "Weird",
    "difficulty": "Easy",
    "hint1": "조종사가 반드시 비행기 안에 있었다고 볼 필요는 없습니다.",
    "hint2": "추락한 비행기의 크기를 의심해 보세요.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/64907/how-did-the-pilot-survive-the-crash"
  },
  {
    "id": "20000000-0000-4000-8000-000000000011",
    "releaseDate": "2026-07-02",
    "title": "1초 만에 센 41장",
    "question": "중고 책을 판 학생이 41달러를 받기로 했다. 직원은 새 1달러 지폐가 잔뜩 든 묶음에서 1초도 안 되어 41장을 떼어 주었다. 학생이 세어 보니 정확히 41장이었다. 직원은 어떻게 그렇게 빨리 셌을까?",
    "answer": "지폐들이 새 묶음이라 일련번호가 순서대로 이어져 있었다. 직원은 장수를 하나씩 세지 않고 끝 지폐의 일련번호 차이로 41장을 확인했다.",
    "explanation": "새 지폐 묶음은 무작위 종이 더미가 아니었다. 순서 정보가 이미 들어 있어서 빠른 확인이 가능했다.",
    "answerKeywords": [
      "새 지폐",
      "일련번호",
      "순서",
      "41장"
    ],
    "category": "Logic",
    "difficulty": "Medium",
    "hint1": "힌트는 지폐가 낡은 것이 아니라 새것이었다는 점입니다.",
    "hint2": "직원은 종이의 개수를 직접 세지 않고 지폐에 적힌 정보를 이용했습니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/48674/how-did-he-count-my-money-so-fast"
  },
  {
    "id": "20000000-0000-4000-8000-000000000012",
    "releaseDate": "2026-07-03",
    "title": "무너지지 않은 제한 중량",
    "question": "정확히 제한 중량과 같은 무게의 트럭이 긴 다리를 건너기 시작했다. 다리 중간을 한참 지난 뒤 작은 새 한 마리가 트럭 위에 앉았다. 그래도 다리는 무너지지 않았다. 왜일까?",
    "answer": "트럭은 다리를 건너는 동안 연료를 소비해 출발 때보다 가벼워졌다. 새의 무게가 더해져도 이미 줄어든 연료 무게보다 작았다.",
    "explanation": "출발 순간의 무게만 보면 위험해 보이지만, 이동 중 연료가 계속 줄었다. 다리 위에서의 실제 총중량은 제한을 넘지 않았다.",
    "answerKeywords": [
      "연료 소비",
      "트럭 무게",
      "제한 중량",
      "다리"
    ],
    "category": "Logic",
    "difficulty": "Easy",
    "hint1": "다리를 건너는 동안 트럭의 무게가 일정했는지 생각해 보세요.",
    "hint2": "새가 더한 무게보다 먼저 줄어든 것이 있었습니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/10000/a-semi-truck-weighing-exactly-10-000-pounds"
  },
  {
    "id": "20000000-0000-4000-8000-000000000013",
    "releaseDate": "2026-07-04",
    "title": "뉴욕에서 금지된 화장",
    "question": "어떤 사람이 텍사스에 사는 남자를 뉴욕에서 화장하는 것은 법으로 금지되어 있다고 말했다. 시신 운구나 주 경계 문제 때문이 아니었다. 왜 금지될까?",
    "answer": "그 남자는 텍사스에 사는, 즉 아직 살아 있는 사람이었다. 살아 있는 사람을 화장하는 것은 살인이므로 당연히 금지된다.",
    "explanation": "문장은 장례 절차처럼 들리지만 '사는 남자'라는 표현이 핵심이다. 죽은 사람이 아니라 산 사람을 대상으로 한 질문이었다.",
    "answerKeywords": [
      "살아 있음",
      "화장",
      "법",
      "표현의 함정"
    ],
    "category": "Paradox",
    "difficulty": "Easy",
    "hint1": "장소보다 사람의 상태를 먼저 보세요.",
    "hint2": "문제는 죽은 사람의 장례 절차를 말하고 있지 않습니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/3564/cremation-in-new-york"
  },
  {
    "id": "20000000-0000-4000-8000-000000000014",
    "releaseDate": "2026-07-05",
    "title": "마스크 쓴 사람들의 칼",
    "question": "마스크를 쓴 낯선 사람들이 칼을 들고 한 어머니에게서 아기를 데려갔다. 어머니는 피를 흘려 처치를 받았고 아기는 울고 있었다. 그런데 부모는 그들을 고소하지 않았고, 모두 이 일이 정상이라고 여겼다. 왜일까?",
    "answer": "그 낯선 사람들은 수술실 의료진이었고, 상황은 제왕절개 출산이었다. 칼은 수술 도구였으며 아기는 태어난 뒤 부모에게 돌아갔다.",
    "explanation": "범죄처럼 묘사된 행동들은 수술실 맥락에서는 의료 행위다. 마스크와 절개, 아기의 울음은 출산 과정의 일부였다.",
    "answerKeywords": [
      "제왕절개",
      "의료진",
      "수술실",
      "출산"
    ],
    "category": "Mystery",
    "difficulty": "Medium",
    "hint1": "마스크와 칼이 범죄 도구가 아닐 수도 있습니다.",
    "hint2": "아기가 부모에게 돌아갔다는 점은 납치가 아니라는 강한 단서입니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/38599/masked-strangers-take-baby-at-knifepoint"
  },
  {
    "id": "20000000-0000-4000-8000-000000000015",
    "releaseDate": "2026-07-06",
    "title": "170개의 배터리",
    "question": "한 엔지니어가 장보기 목록을 보고 배터리를 사 왔다. 아내는 수량을 적지 않았는데도 그는 정확히 170개를 샀다고 말했다. 목록에는 평범한 배터리 종류만 적혀 있었다. 왜 170개였을까?",
    "answer": "목록에는 AA 배터리가 적혀 있었다. 엔지니어는 AA를 16진수 숫자로 해석했고, 0xAA는 10진수로 170이라서 170개를 샀다.",
    "explanation": "일상적인 표기와 엔지니어의 숫자 해석이 충돌했다. 아내에게 AA는 규격이었지만 남자에게는 숫자처럼 보였다.",
    "answerKeywords": [
      "AA 배터리",
      "16진수",
      "170",
      "엔지니어"
    ],
    "category": "Weird",
    "difficulty": "Medium",
    "hint1": "목록에 수량은 없었지만 숫자로 오해할 수 있는 표기가 있었습니다.",
    "hint2": "컴퓨터나 공학에서 A는 숫자처럼 쓰일 수 있습니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/31685/why-did-john-buy-so-many-batteries"
  },
  {
    "id": "20000000-0000-4000-8000-000000000016",
    "releaseDate": "2026-07-07",
    "title": "17마리의 상속",
    "question": "부자는 세 아들에게 17마리의 낙타를 남기며 첫째에게 절반, 둘째에게 3분의 1, 셋째에게 9분의 1을 주라고 했다. 낙타를 자르지 않고 모두가 만족할 방법이 있었다. 어떻게 했을까?",
    "answer": "친구가 낙타 한 마리를 잠시 보태 총 18마리로 만들었다. 첫째는 9마리, 둘째는 6마리, 셋째는 2마리를 받아 총 17마리가 되었고, 남은 한 마리는 친구가 되가져갔다.",
    "explanation": "분배를 쉽게 하려고 임시로 기준 수를 바꾼 것이다. 실제로 상속된 낙타 수는 유언과 맞고 추가된 낙타는 남았다.",
    "answerKeywords": [
      "17마리",
      "18마리",
      "임시로 보탬",
      "상속"
    ],
    "category": "Logic",
    "difficulty": "Easy",
    "hint1": "처음 가진 수만으로 나누려고 하면 막힙니다.",
    "hint2": "누군가 잠깐 한 마리를 빌려주면 계산이 달라집니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/2602/the-sheikh-dies"
  },
  {
    "id": "20000000-0000-4000-8000-000000000017",
    "releaseDate": "2026-07-08",
    "title": "총알 자국이 없는 곳",
    "question": "전쟁 중 돌아온 폭격기들을 조사하니 날개와 몸체 곳곳에 총알 자국이 많았다. 군은 그 부위에 장갑을 덧대려 했지만, 한 수학자는 총알 자국이 거의 없는 부위를 보강하라고 했다. 왜일까?",
    "answer": "조사 대상은 살아 돌아온 비행기뿐이었다. 총알 자국이 많은 부위는 맞아도 귀환할 수 있는 곳이고, 자국이 적은 부위에 맞은 비행기는 돌아오지 못했을 가능성이 컸다.",
    "explanation": "보이는 데이터는 생존자만 포함한 편향된 표본이었다. 보이지 않는 실패 사례까지 고려해야 취약한 부위를 알 수 있었다.",
    "answerKeywords": [
      "생존자 편향",
      "돌아온 비행기",
      "장갑",
      "표본"
    ],
    "category": "Logic",
    "difficulty": "Medium",
    "hint1": "조사한 비행기들은 모두 어떤 공통점을 가지고 있었습니다.",
    "hint2": "총알 자국이 없다는 것은 맞지 않았다는 뜻이 아닐 수 있습니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/57058/save-our-wwii-planes"
  },
  {
    "id": "20000000-0000-4000-8000-000000000018",
    "releaseDate": "2026-07-09",
    "title": "아침에만 피한 골목",
    "question": "한 남자는 출근길마다 지름길 골목을 피해서 멀리 돌아갔다. 하지만 같은 길을 퇴근할 때는 아무렇지 않게 그 골목을 지났다. 골목은 밤에도 위험하지 않았고 사람도 거의 없었다. 왜 아침에만 피했을까?",
    "answer": "그 골목 한쪽에는 철제 난간이 있고 아침 햇빛이 난간 사이로 빠르게 깜박이며 들어왔다. 남자는 빛의 깜박임에 민감한 질환이 있어 발작 위험을 피하려고 아침에만 돌아갔다.",
    "explanation": "위험은 사람이나 범죄가 아니라 시간대와 햇빛 방향이 만든 시각 자극이었다. 저녁에는 같은 효과가 생기지 않았다.",
    "answerKeywords": [
      "햇빛",
      "난간",
      "깜박임",
      "발작 위험"
    ],
    "category": "Mystery",
    "difficulty": "Hard",
    "hint1": "골목 자체보다 하루 중 시간대가 중요합니다.",
    "hint2": "반복되는 빛과 그림자가 어떤 사람에게는 위험할 수 있습니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/43939/the-commuters-journey"
  },
  {
    "id": "20000000-0000-4000-8000-000000000019",
    "releaseDate": "2026-07-10",
    "title": "밀실의 물과 두 시체",
    "question": "수사관이 밀실에 들어갔다. 문은 하루 종일 잠겨 있었고, 바닥에는 깨진 유리와 물, 그리고 앨리스와 밥의 시체가 있었다. 두 시체에는 외상이 없었고 창문은 높은 곳에 깨져 있었다. 무슨 일이 있었을까?",
    "answer": "앨리스와 밥은 사람이 아니라 어항 속 물고기였다. 어항이 깨져 물이 바닥에 쏟아지면서 물고기들이 죽었고, 깨진 유리는 어항 조각이었다.",
    "explanation": "이름 때문에 사람을 떠올리지만 시체의 정체가 다르다. 물과 유리, 외상이 없는 죽음이 어항 사고로 설명된다.",
    "answerKeywords": [
      "물고기",
      "어항",
      "깨진 유리",
      "물"
    ],
    "category": "Mystery",
    "difficulty": "Medium",
    "hint1": "앨리스와 밥이 사람이라는 보장은 없습니다.",
    "hint2": "바닥의 물과 깨진 유리는 같은 물건에서 나온 흔적일 수 있습니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/28293/how-did-alice-and-bob-die"
  },
  {
    "id": "20000000-0000-4000-8000-000000000020",
    "releaseDate": "2026-07-11",
    "title": "없는 방이 많은 호텔",
    "question": "한 투숙객이 호텔에서 방 열쇠를 받았다. 안내판은 다른 방으로 가라고 했고, 다음 방은 찾을 수 없었으며, 옆방은 출입 금지였다. 위층 식당에서는 직원이 음료를 쏟았다. 프런트는 사실 쓸 만한 방이 하나뿐이라고 했다. 무슨 호텔일까?",
    "answer": "그 호텔의 방 번호는 HTTP 상태 코드를 뜻했다. 리다이렉트, 찾을 수 없음, 금지, 서버 오류 같은 코드들이 방에서 일어난 일처럼 표현되었고, 정상인 방은 200 OK였다.",
    "explanation": "호텔의 사건들은 실제 서비스 문제가 아니라 웹 응답 코드의 말장난이었다. 방 번호와 안내 문구가 인터넷 상태 메시지를 가리켰다.",
    "answerKeywords": [
      "HTTP 상태 코드",
      "404",
      "403",
      "200 OK"
    ],
    "category": "Weird",
    "difficulty": "Hard",
    "hint1": "방 번호와 안내 문구가 기술 용어일 수 있습니다.",
    "hint2": "찾을 수 없음, 금지, 오류라는 표현을 웹에서 본 적이 있는지 떠올려 보세요.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/83152/a-strange-hotel"
  },
  {
    "id": "20000000-0000-4000-8000-000000000021",
    "releaseDate": "2026-07-12",
    "title": "지하 감방의 방향",
    "question": "이중간첩이 납치되어 지하 감방에 갇혔다. 그는 자신이 어느 나라 수도에 있는지 몰랐지만, 천장에 매달린 전등만 몇 시간 관찰한 뒤 확신을 갖고 올바른 언어로 간수에게 말을 걸어 풀려났다. 어떻게 알았을까?",
    "answer": "전등이 긴 줄에 매달려 있었고, 그는 그것을 진자처럼 보아 회전 방향을 관찰했다. 푸코 진자처럼 흔들림의 변화로 자신이 어느 반구에 있는지 추정했고, 가능한 두 수도 중 하나를 골랐다.",
    "explanation": "감방 안의 사물은 위치 정보를 직접 주지 않았지만 지구 자전에 따른 미세한 단서를 줄 수 있었다. 그는 두 후보 국가가 서로 다른 반구에 있다는 점을 이용했다.",
    "answerKeywords": [
      "푸코 진자",
      "전등",
      "반구",
      "지구 자전"
    ],
    "category": "Mystery",
    "difficulty": "Hard",
    "hint1": "전등은 밝히는 용도 말고도 움직임을 관찰할 수 있는 물건입니다.",
    "hint2": "그가 알아낸 것은 정확한 주소가 아니라 두 후보를 가르는 지리 정보였습니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/3215/a-double-agent-with-a-conundrum"
  },
  {
    "id": "20000000-0000-4000-8000-000000000022",
    "releaseDate": "2026-07-13",
    "title": "오랜만의 카페 모임",
    "question": "일곱 친구가 카페에 모였다. 가장 큰 친구는 우리가 다 같이 모인 지 수백만 년은 된 것 같다고 했고, 다른 친구들은 추운 고향, 커다란 동물 무늬 바지, 오페라하우스 같은 이야기를 했다. 이 친구들은 누구일까?",
    "answer": "그 친구들은 사람이 아니라 일곱 대륙을 의인화한 존재였다. 가장 큰 친구는 아시아이고, 추운 고향은 남극, 동물 무늬는 아프리카, 오페라하우스는 오세아니아를 가리킨다.",
    "explanation": "이름과 말투가 사람처럼 보이지만 단서들은 지리적 특징이다. 수백만 년 전 함께 있었다는 말도 대륙 이동을 암시한다.",
    "answerKeywords": [
      "일곱 대륙",
      "아시아",
      "남극",
      "대륙 이동"
    ],
    "category": "Weird",
    "difficulty": "Medium",
    "hint1": "친구들의 이름과 대화가 지리 수업의 단서처럼 보이지 않는지 보세요.",
    "hint2": "모두가 오래전 하나로 붙어 있었다는 말이 중요합니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/40019/breakfast-with-friends"
  },
  {
    "id": "20000000-0000-4000-8000-000000000023",
    "releaseDate": "2026-07-14",
    "title": "가족을 쐈다는 남자",
    "question": "사냥철이 끝난 뒤 친구들이 모여 자랑을 했다. 한 사람은 큰 사슴을 잡았다고 했고, 다른 사람도 더 큰 사냥감을 말했다. 마지막 사람이 가족과 개까지 쐈다고 했지만 아무도 놀라지 않았다. 왜일까?",
    "answer": "그 남자는 사냥꾼이 아니라 사진가였고, '쐈다'는 말은 사진을 찍었다는 뜻이었다. 가족과 개도 총으로 공격한 것이 아니라 카메라에 담은 대상이었다.",
    "explanation": "같은 표현이 앞 사람들의 사냥 이야기 때문에 위험하게 들렸다. 마지막 사람은 다른 의미로 같은 말을 쓴 것이다.",
    "answerKeywords": [
      "사진가",
      "카메라",
      "찍었다",
      "말의 중의성"
    ],
    "category": "Paradox",
    "difficulty": "Easy",
    "hint1": "마지막 사람의 직업이나 취미가 앞사람들과 같다고 단정하지 마세요.",
    "hint2": "쐈다는 말이 총만 뜻하지 않을 수 있습니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/48704/friends-met-up-at-the-bar"
  },
  {
    "id": "20000000-0000-4000-8000-000000000024",
    "releaseDate": "2026-07-15",
    "title": "죽은 자매의 생일",
    "question": "두 자매가 같은 해 같은 날 태어났지만 쌍둥이는 아니었다. 다른 가족 중 같은 생일을 가진 사람도 없었다. 두 사람은 거짓말을 하지 않았다. 어떻게 가능할까?",
    "answer": "두 사람은 혈연 자매가 아니라 같은 수녀회에서 서로를 자매라고 부르는 수녀들이었다. 우연히 같은 날 태어났을 뿐 쌍둥이가 아니었다.",
    "explanation": "자매라는 단어를 가족 관계로만 해석하면 모순이 생긴다. 종교 공동체의 호칭으로 보면 같은 생일은 단순한 우연이다.",
    "answerKeywords": [
      "수녀",
      "자매 호칭",
      "혈연 아님",
      "같은 생일"
    ],
    "category": "Logic",
    "difficulty": "Medium",
    "hint1": "자매라는 말이 반드시 부모가 같은 사람을 뜻하지는 않습니다.",
    "hint2": "종교 공동체에서 쓰는 호칭을 생각해 보세요.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/3637/two-sisters-born-on-the-same-day"
  },
  {
    "id": "20000000-0000-4000-8000-000000000025",
    "releaseDate": "2026-07-16",
    "title": "문제의 기록",
    "question": "어떤 자연수 기록은 한 번 세워지면 다음 사람이 반드시 최소 2 이상 큰 수로만 깰 수 있다. 505가 현재 기록이라면 506으로는 절대 깰 수 없고, 507 이상이어야 한다. 무슨 기록일까?",
    "answer": "그 기록은 한 사람이 깬 기록의 개수다. 기존 최고인 505개를 넘기려면 적어도 506번째 다른 기록을 깨야 하고, 그 순간 '가장 많은 기록을 깬 기록'도 함께 깨져 총 507개가 된다.",
    "explanation": "기록을 깨는 행위 자체가 또 하나의 기록으로 더해지는 자기참조 구조다. 그래서 항상 최소 두 개가 증가한다.",
    "answerKeywords": [
      "자기참조",
      "기록을 깬 기록",
      "505",
      "두 개 증가"
    ],
    "category": "Logic",
    "difficulty": "Hard",
    "hint1": "그 기록은 다른 기록들과 관계가 있습니다.",
    "hint2": "기존 기록을 깨는 순간 새로 하나가 자동으로 더해집니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/41852/breaking-the-record"
  },
  {
    "id": "20000000-0000-4000-8000-000000000026",
    "releaseDate": "2026-07-17",
    "title": "하트 없는 남편",
    "question": "한 남자가 삽 모양의 카드를 내려놓고 웃었다. 아내는 하트 카드를 냈고, 그 때문에 점수를 크게 잃었다. 남자는 아내를 사랑했지만 정말로 하트가 없었다. 무슨 상황일까?",
    "answer": "두 사람은 카드 게임 하트를 하고 있었다. 남편은 손에 하트 무늬 카드가 없어서 스페이드 카드를 버릴 수 있었고, 그 카드가 아내에게 불리한 점수를 주었다.",
    "explanation": "하트가 없다는 말은 감정이 없다는 뜻이 아니라 카드 패에 하트 무늬가 없다는 뜻이다. 삽 모양도 실제 삽이 아니라 스페이드 문양이다.",
    "answerKeywords": [
      "카드 게임",
      "하트",
      "스페이드",
      "패"
    ],
    "category": "Weird",
    "difficulty": "Medium",
    "hint1": "하트와 삽을 실제 물건이나 감정으로만 보지 마세요.",
    "hint2": "두 사람은 다투는 것이 아니라 게임을 하고 있었습니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/60844/a-loving-marriage"
  },
  {
    "id": "20000000-0000-4000-8000-000000000027",
    "releaseDate": "2026-07-18",
    "title": "두 쌍의 장갑",
    "question": "전염병이 도는 기지에서 세 의사가 차례로 수술해야 했다. 새 장갑은 두 쌍뿐이었고, 의사끼리도 환자끼리도 직접 오염이 옮으면 안 됐다. 그런데 세 수술 모두 안전하게 마칠 방법이 있었다. 어떻게 했을까?",
    "answer": "첫 의사는 두 쌍을 겹쳐 끼고 수술했다. 둘째는 바깥 장갑만 벗겨 안쪽이 깨끗한 면을 손에 닿게 했고, 셋째는 첫 장갑을 뒤집어 깨끗했던 면이 손과 환자 쪽에 오도록 사용했다.",
    "explanation": "핵심은 장갑을 한 덩어리로 보지 않고 안쪽과 바깥쪽 면을 구분하는 것이다. 오염된 면끼리만 접촉하게 배치하면 제한된 장갑으로도 격리가 가능하다.",
    "answerKeywords": [
      "장갑",
      "안쪽과 바깥쪽",
      "뒤집기",
      "오염 방지"
    ],
    "category": "Logic",
    "difficulty": "Hard",
    "hint1": "장갑 한 쌍에도 손에 닿는 면과 환자에게 닿는 면이 따로 있습니다.",
    "hint2": "한 번 쓴 장갑을 그냥 다시 쓰는 것이 아니라 방향을 바꾸는 방법이 필요합니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/1761/doctors-dilemma"
  },
  {
    "id": "20000000-0000-4000-8000-000000000028",
    "releaseDate": "2026-07-19",
    "title": "멈추지 않는 출장지",
    "question": "여행사가 보낸 일정표에는 서로 다른 여러 도시에서 래프팅, 쇼핑, 음악 축제, 운전 체험 같은 일정이 적혀 있었다. 고객은 여러 나라를 도는 줄 알고 화를 냈지만, 여행사는 목적지는 하나뿐이라고 했다. 어떻게 된 일일까?",
    "answer": "각 일정의 장소나 활동은 실제 방문지가 아니라 NATO 음성 알파벳의 단어를 끌어내는 단서였다. 단서에서 얻은 글자를 이어 읽으면 하나의 목적지 이름이 나왔다.",
    "explanation": "일정표는 여행 계획처럼 보였지만 사실 암호였다. 여러 장소명은 각각 한 글자를 만들기 위한 힌트였고, 최종 목적지는 그 글자들의 조합이었다.",
    "answerKeywords": [
      "암호",
      "NATO 음성 알파벳",
      "여행 일정",
      "하나의 목적지"
    ],
    "category": "Weird",
    "difficulty": "Hard",
    "hint1": "일정표의 장소를 실제로 방문한다고 생각하면 너무 비효율적입니다.",
    "hint2": "장소와 활동은 각각 한 글자를 만드는 단서일 수 있습니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/99827/a-phone-call-with-my-travel-agent"
  }
]
$curated$::jsonb) as item(
    id uuid,
    "releaseDate" date,
    title text,
    question text,
    answer text,
    explanation text,
    "answerKeywords" jsonb,
    category text,
    difficulty text,
    source text,
    "sourceUrl" text,
    hint1 text,
    hint2 text
  )
), inserted as (
  insert into public.problems (
    id, title, question, answer, explanation, answer_keywords,
    category, difficulty, source, source_url, hint_1, hint_2
  )
  select
    id, title, question, answer, explanation,
    array(select jsonb_array_elements_text("answerKeywords")),
    category, difficulty, source, "sourceUrl", hint1, hint2
  from curated
  on conflict (id) do update set
    title = excluded.title,
    question = excluded.question,
    answer = excluded.answer,
    explanation = excluded.explanation,
    answer_keywords = excluded.answer_keywords,
    category = excluded.category,
    difficulty = excluded.difficulty,
    source = excluded.source,
    source_url = excluded.source_url,
    hint_1 = excluded.hint_1,
    hint_2 = excluded.hint_2
  where not exists (
    select 1 from public.game_sessions gs
    where gs.problem_id = problems.id
  )
  returning id
)
insert into public.daily_releases (release_date, problem_id, is_released)
select "releaseDate", id, "releaseDate" <= current_date
from curated
on conflict (release_date) do update set
  problem_id = excluded.problem_id,
  is_released = excluded.is_released
where not exists (
  select 1 from public.game_sessions gs
  where gs.problem_id = daily_releases.problem_id
);
