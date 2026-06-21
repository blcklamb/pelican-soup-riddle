# Curated Problem Import

외부 문제를 자동 복제하지 않습니다. 출처를 확인한 뒤 핵심 아이디어를 검토하고, 한국어 문안과 설명을 직접 작성한 데이터만 등록합니다.

`data/curated-problems.json` 형식:

```json
[
  {
    "releaseDate": "2026-07-01",
    "title": "자체 작성 제목",
    "question": "사용자에게 보여 줄 상황 설명",
    "answer": "핵심 원인과 인과관계를 포함한 정답",
    "explanation": "게임 종료 후 보여 줄 해설",
    "answerKeywords": ["핵심 원인", "장치", "결과"],
    "category": "Logic",
    "difficulty": "Medium",
    "hint1": "정답을 직접 말하지 않는 방향 힌트",
    "hint2": "핵심 명사를 숨긴 더 구체적인 힌트",
    "source": "Web",
    "sourceUrl": "https://example.com/reference"
  }
]
```

`source`는 `Manual` 또는 `Web`, `category`는 `Paradox | Weird | Logic | Mystery`, `difficulty`는 `Easy | Medium | Hard`만 허용합니다. `source="Web"` 문제는 `sourceUrl`이 필수이며, 모든 import 문제는 `hint1`과 `hint2`를 포함해야 합니다.

```bash
npm run problems:import
```

같은 공개 날짜가 이미 있으면 import가 중단됩니다. 데이터 검수 후 날짜를 조정하거나 기존 일정을 명시적으로 정리해야 합니다.
