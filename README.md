# Turtle Soup AI

OpenAI와 Supabase를 사용하는 모바일 퍼스트 바다거북 스프 추리 게임입니다. 게임 마스터는 질문마다 `예`, `아니오`, `관련 없음`으로 답하고, 사용자의 최종 추리를 AI로 검증합니다.

## 시작하기

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local`에 다음 값을 설정해야 실제 화면이 활성화됩니다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
```

환경변수가 없으면 애플리케이션은 외부 호출 대신 설정 안내 화면을 표시합니다.

## Supabase 설정

Supabase SQL Editor 또는 CLI에서 다음 순서로 적용합니다.

1. `supabase/migrations/202606140001_initial_schema.sql`
2. `supabase/seed.sql`

시드 파일은 실행 날짜를 기준으로 최근 10일에 문제를 배치하므로, 적용 즉시 오늘의 문제와 지난 문제를 조회할 수 있습니다. 서비스 역할 키는 서버 Route Handler에서만 사용되며 클라이언트 번들에 포함하면 안 됩니다.

## 명령어

```bash
npm run lint
npm test
npm run build
```

## 주요 경로

- `/`: 오늘의 문제
- `/game/[problemId]`: AI 채팅과 정답 제출
- `/archive`: 현재 브라우저 기기의 게임 기록
- `/archive/[sessionId]`: 완료된 사건의 대화와 해설

기기 식별자는 로그인 대신 브라우저 localStorage에 생성됩니다. 저장소를 지우거나 시크릿 창을 사용하면 별도 사용자로 취급됩니다.
