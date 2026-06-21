-- Source-based curated turtle soup problems.
-- Generated from data/curated-problems.json.

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
    "title": "신문으로 알아챈 살인",
    "question": "여행사 직원이 아침 신문에서 한 여성이 유람선에서 바다에 빠져 숨졌다는 기사를 읽었다. 그는 그 배에 타지 않았고 피해자를 직접 본 적도 없었지만, 사고가 아니라 살인이라고 생각했다. 왜일까?",
    "answer": "며칠 전 같은 성을 가진 남자가 그 여행사에서 유람선 표 두 장을 샀다. 자기 표는 왕복이었지만 함께 가는 여성의 표는 편도였고, 직원은 그가 처음부터 혼자 돌아올 계획이었다고 의심했다.",
    "explanation": "기사만으로는 사고처럼 보였지만, 여행사 직원은 피해자와 동행자의 표 구매 내역을 알고 있었다. 한 사람만 왕복표를 산 사실이 바다에 빠진 죽음을 계획된 범행으로 보이게 했다.",
    "answerKeywords": [
      "왕복표",
      "편도표",
      "유람선",
      "여행사"
    ],
    "category": "Mystery",
    "difficulty": "Medium",
    "hint1": "직원은 기사 밖의 정보를 하나 더 알고 있었습니다.",
    "hint2": "두 사람이 같은 여행을 떠났지만 돌아오는 표는 같지 않았습니다.",
    "source": "Web",
    "sourceUrl": "https://www.kith.org/jed/situation-puzzles/answers-to-jeds-list-of-situation-puzzles/"
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
    "title": "닫힌 상자 속 손님",
    "question": "한 남자가 조용한 대기실에 앉아 있었다. 잠시 뒤 누군가 닫힌 종이상자를 들고 들어와 옆자리에 앉았다. 남자는 상자 안을 보지도, 소리를 듣지도, 냄새를 맡지도 못했는데 곧 안에 무엇이 있는지 알아차렸다. 어떻게 알았을까?",
    "answer": "남자는 고양이 알레르기가 있었다. 상자 안의 고양이 털이나 비듬 때문에 재채기와 눈 가려움 같은 반응이 바로 나타났고, 그는 상자 안에 고양이가 있다고 알았다.",
    "explanation": "그가 얻은 정보는 시각, 청각, 후각이 아니라 몸의 반응이었다. 알레르기는 내용물을 직접 확인하지 않아도 특정 동물의 존재를 알려 줄 수 있다.",
    "answerKeywords": [
      "고양이",
      "알레르기",
      "닫힌 상자",
      "몸의 반응"
    ],
    "category": "Mystery",
    "difficulty": "Medium",
    "hint1": "남자가 사용한 감각은 눈, 귀, 코가 아닙니다.",
    "hint2": "몸이 특정 동물에 먼저 반응할 수 있습니다.",
    "source": "Web",
    "sourceUrl": "https://www.kith.org/jed/situation-puzzles/answers-to-jeds-list-of-situation-puzzles/"
  },
  {
    "id": "20000000-0000-4000-8000-000000000010",
    "releaseDate": "2026-07-01",
    "title": "초대했다가 해고된 직원",
    "question": "박물관 직원이 중요한 거래 상대에게 저녁 식사를 제안했다가 그날 바로 해고되었다. 그는 무례한 말을 하지 않았고 비용이나 장소 문제도 없었다. 단지 상대가 계속 언급하던 이름을 듣고 '그분도 함께 오셔도 됩니다'라고 덧붙였을 뿐이었다. 왜 해고되었을까?",
    "answer": "거래 상대가 말하던 이름은 사람이 아니라 새로 발견한 고대 인골에 붙인 이름이었다. 직원은 그것을 배우자나 동료로 오해했고, 박물관 직원이라면 알아야 할 중요한 발견을 몰랐다는 사실이 드러나 신뢰를 잃었다.",
    "explanation": "문제의 핵심은 초대 자체가 아니라 이름의 정체다. 직원의 말은 예의 바른 제안처럼 보였지만, 업무상 반드시 알아야 할 전시품을 사람으로 착각한 실수였다.",
    "answerKeywords": [
      "박물관",
      "고대 인골",
      "이름 오해",
      "업무 지식"
    ],
    "category": "Mystery",
    "difficulty": "Medium",
    "hint1": "초대받은 '그분'이 실제 사람이었는지 의심해 보세요.",
    "hint2": "직원의 실수는 예절이 아니라 전문 지식과 관련되어 있습니다.",
    "source": "Web",
    "sourceUrl": "https://www.kith.org/jed/situation-puzzles/answers-to-jeds-list-of-situation-puzzles/"
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
    "title": "돌아온 볼링공",
    "question": "한 교수가 학생들 앞에서 볼링공을 자기 코앞까지 당겼다가 그대로 놓았다. 그는 공을 피하지 않았고 줄도 끊어지지 않았는데, 잠시 뒤 얼굴을 다쳐 병원으로 실려 갔다. 실험은 원래 안전해야 했다. 왜 다쳤을까?",
    "answer": "볼링공은 줄에 매달린 진자 실험용이었다. 그냥 놓으면 처음 높이보다 높게 돌아오지 않아 코앞에서 멈춰야 했지만, 교수가 무심코 공을 살짝 밀어 에너지가 더해졌고 돌아오는 공이 얼굴을 쳤다.",
    "explanation": "장치가 고장 난 것이 아니라 놓는 방식이 달랐다. '그대로 놓았다'고 생각하면 안전하지만, 아주 작은 밀림이 실험의 전제를 깨뜨렸다.",
    "answerKeywords": [
      "진자",
      "볼링공",
      "살짝 밀었다",
      "실험"
    ],
    "category": "Mystery",
    "difficulty": "Medium",
    "hint1": "실험 장치는 정상이어도 시작 동작이 달라질 수 있습니다.",
    "hint2": "공은 단순히 놓인 것이 아니라 아주 조금 더 힘을 받았습니다.",
    "source": "Web",
    "sourceUrl": "https://www.kith.org/jed/situation-puzzles/answers-to-jeds-list-of-situation-puzzles/"
  },
  {
    "id": "20000000-0000-4000-8000-000000000014",
    "releaseDate": "2026-07-05",
    "title": "모래로 지킨 목숨",
    "question": "한 남자가 해변에서 협박을 받아 밀물이 오면 물에 잠길 위치에 목만 남기고 스스로를 모래에 묻어야 했다. 그는 도움을 부를 수도, 상대를 제압할 수도 없었지만 지시를 어기지 않고 살아남았다. 어떻게 했을까?",
    "answer": "그는 구덩이를 파서 들어간 것이 아니라 몸 주위에 모래를 높게 쌓아 목만 보이게 만들었다. 물이 들어오면 모래 더미가 먼저 무너져 그를 풀어 주고, 몸도 원래 지면보다 높아져 바로 잠기지 않았다.",
    "explanation": "묻는다는 말을 아래로 파묻는 행동으로만 해석하면 탈출할 수 없다. 그는 같은 말의 조건을 지키면서도 자신을 가두지 않는 방식으로 모래를 이용했다.",
    "answerKeywords": [
      "모래 더미",
      "밀물",
      "구덩이 아님",
      "해변"
    ],
    "category": "Mystery",
    "difficulty": "Medium",
    "hint1": "모래에 묻힌다는 말이 꼭 아래로 들어간다는 뜻은 아닙니다.",
    "hint2": "물이 오면 모래 구조물은 오래 버티지 못합니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/3100/up-to-your-head-in-trouble"
  },
  {
    "id": "20000000-0000-4000-8000-000000000015",
    "releaseDate": "2026-07-06",
    "title": "컵 손잡이의 2초",
    "question": "한 여자가 전자레인지에 커피를 정확히 2분 데웠다. 끝나자마자 문을 열어 안을 확인하더니 아무것도 넣거나 빼지 않고 문을 닫아 2초만 더 돌렸다. 커피는 이미 충분히 뜨거웠다. 왜 2초가 더 필요했을까?",
    "answer": "컵 손잡이가 전자레인지 안쪽을 향해 있어 바로 잡으면 손을 데일 수 있었다. 그녀는 회전판을 조금 더 돌려 손잡이가 앞쪽으로 오게 하려고 2초를 더 돌렸다.",
    "explanation": "추가 시간은 커피를 더 데우기 위한 것이 아니었다. 전자레인지 회전판의 위치를 바꿔 안전하게 컵을 꺼내려는 행동이었다.",
    "answerKeywords": [
      "전자레인지",
      "컵 손잡이",
      "회전판",
      "2초"
    ],
    "category": "Logic",
    "difficulty": "Medium",
    "hint1": "2초는 온도를 크게 바꾸기 위한 시간이 아닙니다.",
    "hint2": "전자레인지 안에서 컵의 방향이 달라질 수 있습니다.",
    "source": "Web",
    "sourceUrl": "https://www.kith.org/jed/situation-puzzles/answers-to-jeds-list-of-situation-puzzles/"
  },
  {
    "id": "20000000-0000-4000-8000-000000000016",
    "releaseDate": "2026-07-07",
    "title": "죽은 남자의 배낭",
    "question": "넓은 들판 한가운데 한 남자가 죽어 있었다. 그의 등에 배낭이 있었고 주변에는 싸움 흔적도, 그를 공격한 사람의 흔적도 없었다. 배낭 안의 물건이 제대로 작동했다면 그는 죽지 않았을 것이다. 무슨 일이 있었을까?",
    "answer": "그 배낭은 낙하산이었다. 남자는 비행기에서 뛰어내렸지만 낙하산이 펴지지 않아 그대로 추락했다.",
    "explanation": "배낭을 여행용 짐으로 생각하면 단서가 부족해 보인다. 실제로는 생존 장비였고, 그 장비가 실패한 것이 죽음의 원인이었다.",
    "answerKeywords": [
      "낙하산",
      "배낭",
      "추락",
      "펴지지 않음"
    ],
    "category": "Mystery",
    "difficulty": "Easy",
    "hint1": "배낭은 단순한 짐가방이 아닐 수 있습니다.",
    "hint2": "그가 들판에 도착한 방식이 핵심입니다.",
    "source": "Web",
    "sourceUrl": "https://www.kith.org/jed/situation-puzzles/answers-to-jeds-list-of-situation-puzzles/"
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
    "title": "이상한 호텔 이웃",
    "question": "바닷가 호텔 10층 옆방 가족은 매일 아침 식사하러 갈 때 엘리베이터를 탔다. 그런데 저녁 식사를 마치고 방으로 돌아올 때만 네 식구가 10층까지 계단을 걸어 올라갔다. 엘리베이터는 멀쩡했고 가족은 운동을 좋아하지도 않았다. 왜 그랬을까?",
    "answer": "부모가 어린아이들을 밤에 재우려고 일부러 계단을 오르게 한 것이다. 저녁 뒤 에너지를 쓰게 하면 아이들이 더 빨리 잠들고, 부모도 조용히 쉴 수 있었다.",
    "explanation": "계단을 선택한 이유는 이동 효율이 아니라 이후의 효과였다. 가족 여행 중 흥분한 아이들을 재우기 위한 부모의 현실적인 선택이었다.",
    "answerKeywords": [
      "아이들",
      "계단",
      "잠들게 하려고",
      "호텔"
    ],
    "category": "Mystery",
    "difficulty": "Medium",
    "hint1": "계단을 오르는 행동의 목적은 방에 빨리 가는 것이 아닙니다.",
    "hint2": "저녁 이후 아이들의 상태를 생각해 보세요.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/31772/my-strange-hotel-room-neighbours"
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
    "title": "독이 든 만찬",
    "question": "왕에게 괴롭힘을 당하던 주방장은 오늘 저녁 음식으로 반드시 고통에서 벗어나겠다고 말했다. 왕은 수상하게 여겨 같은 음식 두 접시를 준비하게 하고, 하나는 왕이 고르고 다른 하나는 주방장이 동시에 먹게 했다. 독은 한 접시에만 넣을 수 있고 해독제도 없었다. 그런데 주방장은 계획이 반드시 성공한다고 했다. 왜일까?",
    "answer": "주방장의 목표는 왕의 괴롭힘에서 벗어나는 것이었다. 왕이 독이 든 접시를 먹으면 왕이 죽어 괴롭힘이 끝나고, 주방장이 독이 든 접시를 먹으면 주방장 자신이 죽어 더 이상 괴롭힘을 당하지 않는다.",
    "explanation": "계획의 성공 조건을 '왕을 반드시 죽인다'고 보면 불가능해 보인다. 하지만 주방장이 말한 소원은 괴롭힘에서 벗어나는 것이었고, 두 결과 모두 그 조건을 만족한다.",
    "answerKeywords": [
      "주방장",
      "왕",
      "독",
      "소원의 조건"
    ],
    "category": "Paradox",
    "difficulty": "Hard",
    "hint1": "주방장의 목표를 정확히 다시 읽어 보세요.",
    "hint2": "계획은 왕이 어느 접시를 고르든 같은 조건을 만족합니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/57801/the-head-chef-and-the-mad-king"
  },
  {
    "id": "20000000-0000-4000-8000-000000000021",
    "releaseDate": "2026-07-12",
    "title": "못 하나의 삼각형",
    "question": "두 사람이 판자 세 장과 못 하나, 망치 하나만으로 '들어 올릴 수 있는 삼각형'을 만들 수 있는지 내기를 했다. 못은 판자 두 장을 고정할 길이밖에 안 됐고 다른 도구나 접착제는 없었다. 그런데 한 사람은 조건을 어기지 않고 이겼다. 어떻게 했을까?",
    "answer": "그는 판자들을 이어 붙여 구조물을 만든 것이 아니라 못 끝으로 판자 하나에 삼각형을 긁어 그렸다. 삼각형은 판자에 새겨져 있으니 판자째 들어 올릴 수 있었다.",
    "explanation": "내기의 조건은 '삼각형 모양의 구조물'이라고 말하지 않았다. 그는 만들 대상의 의미를 넓게 보고, 들 수 있는 판자 위에 삼각형을 만들었다.",
    "answerKeywords": [
      "못",
      "판자",
      "긁어 그린 삼각형",
      "내기"
    ],
    "category": "Weird",
    "difficulty": "Medium",
    "hint1": "삼각형이 반드시 세 판자로 이루어진 구조물일 필요는 없습니다.",
    "hint2": "못은 고정하는 용도 말고도 흔적을 남기는 데 쓸 수 있습니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/14960/3-planks-1-nail"
  },
  {
    "id": "20000000-0000-4000-8000-000000000022",
    "releaseDate": "2026-07-13",
    "title": "말을 바꾼 결승선",
    "question": "두 구혼자는 '자신의 말이 더 늦게 결승선에 도착하는 사람이 이긴다'는 경주를 하게 되었다. 둘은 서로 움직이지 않고 버티기만 했지만, 한 노인의 한마디를 듣자마자 전속력으로 결승선을 향해 달렸다. 노인은 뭐라고 했을까?",
    "answer": "노인은 서로 말을 바꿔 타라고 했다. 이제 각자는 상대의 말에 타고 있으므로 자신이 빨리 결승선에 도착할수록 상대의 말이 먼저 도착하고, 자기 원래 말은 뒤에 남게 된다.",
    "explanation": "승부 조건은 사람이 아니라 말의 도착 순서였다. 말을 바꾸면 각자가 빨리 달릴 이유가 생기고도 자기 말이 늦게 도착하게 만들 수 있다.",
    "answerKeywords": [
      "말 바꾸기",
      "늦게 도착",
      "경주 조건",
      "구혼자"
    ],
    "category": "Logic",
    "difficulty": "Medium",
    "hint1": "이기는 기준은 사람이 아니라 말에게 붙어 있습니다.",
    "hint2": "각자가 탄 말이 자기 말이 아니게 되면 목표가 달라집니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/3839/race-of-patience-for-the-sake-of-love"
  },
  {
    "id": "20000000-0000-4000-8000-000000000023",
    "releaseDate": "2026-07-14",
    "title": "사라진 얼음 발판",
    "question": "빈 창고 한가운데, 성인 손이 닿지 않는 높이에 작은 종이 걸려 있었다. 창고에는 사다리도 의자도 상자도 없었고, 바닥에는 물웅덩이만 남아 있었다. 종이를 건 사람은 혼자였고 천장을 타고 올라가지도 않았다. 어떻게 걸었을까?",
    "answer": "그는 큰 얼음덩이를 발판으로 삼아 올라가 종이를 걸었다. 시간이 지나 얼음이 녹아 사라졌기 때문에 창고에는 발판 대신 물웅덩이만 남았다.",
    "explanation": "발판이 없었던 것이 아니라 조사 시점에는 사라진 상태였다. 얼음은 단단한 발판이 될 수 있지만 녹으면 물만 남긴다.",
    "answerKeywords": [
      "얼음",
      "녹은 물",
      "발판",
      "높은 곳"
    ],
    "category": "Mystery",
    "difficulty": "Medium",
    "hint1": "발판이 처음부터 없었다고 단정하지 마세요.",
    "hint2": "바닥의 물웅덩이는 사라진 물건의 흔적일 수 있습니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/15209/how-did-the-man-hang-himself"
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
    "title": "새 향수의 위험",
    "question": "한 남자가 생일 선물로 받은 향수를 뿌리고 평소처럼 일하러 나갔다. 그는 누구와 싸우지도 않았고 위험한 장소에 들어가지도 않았지만 곧 치명적인 공격을 받았다. 향수 자체에는 독이 없었다. 왜일까?",
    "answer": "그는 양봉가였다. 평소 냄새에 익숙하던 벌들이 낯선 향을 위험 신호처럼 받아들였고, 그를 알아보지 못해 떼로 공격했다.",
    "explanation": "향수는 사람에게 해롭지 않았지만 남자의 직업 환경에서는 중요한 변화를 만들었다. 벌에게 익숙하지 않은 냄새가 공격을 유발한 것이다.",
    "answerKeywords": [
      "양봉가",
      "향수",
      "벌",
      "낯선 냄새"
    ],
    "category": "Mystery",
    "difficulty": "Medium",
    "hint1": "향수가 해로운 물질이라서 문제가 된 것은 아닙니다.",
    "hint2": "남자의 일터에는 냄새 변화에 민감한 존재들이 있었습니다.",
    "source": "Web",
    "sourceUrl": "https://www.kith.org/jed/situation-puzzles/answers-to-jeds-list-of-situation-puzzles/"
  },
  {
    "id": "20000000-0000-4000-8000-000000000026",
    "releaseDate": "2026-07-17",
    "title": "서른 살의 동생",
    "question": "쌍둥이 남매가 영상 통화를 했다. 동생이 형에게 '서른 번째 생일 축하해'라고 하자 형은 '나는 아직 서른이 아니고, 오히려 네가 먼저 서른이 됐다'고 말했다. 둘은 같은 날 태어났고 형이 몇 분 먼저 태어난 것도 사실이었다. 어떻게 가능할까?",
    "answer": "두 사람이 서로 다른 시간대에 있었다. 동생이 있는 곳은 이미 생일 날짜가 되었지만 형이 있는 곳은 아직 전날이라서, 늦게 태어난 동생이 달력상 먼저 서른 살이 되었다.",
    "explanation": "나이의 순서는 출생 시각만으로 정해지지만, 생일이 되는 순간은 현재 있는 지역의 날짜에 따라 달라질 수 있다. 시간대 차이가 역전을 만든 것이다.",
    "answerKeywords": [
      "쌍둥이",
      "시간대",
      "영상 통화",
      "생일"
    ],
    "category": "Paradox",
    "difficulty": "Medium",
    "hint1": "두 사람이 같은 장소에 있지 않았다는 점을 생각해 보세요.",
    "hint2": "생일 날짜는 지역의 현재 날짜에 따라 먼저 올 수 있습니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/82003/sallys-older-brother"
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
    "title": "한 살을 건너뛴 생일",
    "question": "한 남자가 스무 번째 생일 파티에서 케이크를 자른 뒤 손님들에게 고맙다고 말했다. 이어서 그는 '내년에 스물두 살이 되면 다시 초대하겠다'고 했다. 그는 나이를 속인 것도 아니고 생일을 빼먹은 것도 아니었다. 어떻게 가능할까?",
    "answer": "그는 12월 31일 자정 직전에 태어났다. 파티 중 날짜가 1월 1일로 넘어간 뒤 말했기 때문에, 그가 말한 '내년'에는 이미 올해 말의 스물한 번째 생일이 지난 다음이라 스물두 번째 생일이 온다.",
    "explanation": "말을 한 시점이 생일이 시작된 해와 달라진 것이 핵심이다. 자정 직전 생일이라면 파티 도중 새해가 되어 '내년'이라는 기준이 한 해 뒤로 밀린다.",
    "answerKeywords": [
      "12월 31일",
      "자정",
      "새해",
      "생일"
    ],
    "category": "Logic",
    "difficulty": "Medium",
    "hint1": "그 말을 한 시점이 케이크를 자른 시점과 같은 날짜였는지 보세요.",
    "hint2": "생일이 연말 자정 직전에 있으면 '내년'의 기준이 달라질 수 있습니다.",
    "source": "Web",
    "sourceUrl": "https://puzzling.stackexchange.com/questions/89633/today-i-am-20-but-next-year-i-will-turn-22"
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
