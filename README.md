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
CRON_SECRET=
```

환경변수가 없으면 애플리케이션은 외부 호출 대신 설정 안내 화면을 표시합니다.

## Supabase 설정

Supabase SQL Editor 또는 CLI에서 다음 순서로 적용합니다.

저장소의 migration을 순서대로 적용한 뒤 seed를 실행합니다. 연결된 프로젝트에서는 다음 명령을 사용합니다.

```bash
supabase db push
```

새 자동 생성 시스템에는 `supabase/migrations/202606140006_add_daily_problem_automation.sql`이 필요합니다.

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
- `/problems`: 이전에 발행된 문제 선택 및 재도전
- `/archive`: 현재 브라우저 기기의 게임 기록
- `/archive/[sessionId]`: 완료된 사건의 대화와 해설

기기 식별자는 로그인 대신 브라우저 localStorage에 생성됩니다. 저장소를 지우거나 시크릿 창을 사용하면 별도 사용자로 취급됩니다.

게임 세션은 기본 20분 동안 유효합니다. 시간이 만료되면 입력이 잠기며, 사용자는 20분 연장하거나 포기하고 정답을 확인할 수 있습니다.

한 세션에서 AI에게 보낼 수 있는 유효 질문은 최대 30개입니다. 예/아니오로 답할 수 없는 입력은 질문 수에 포함되지 않으며, 제한에 도달한 뒤에는 정답 제출 또는 포기만 가능합니다.

## 데일리 문제 자동 생성

- 매주 월요일 `00:10 KST`: 앞으로 28일 중 비어 있는 날짜를 AI 문제로 보충
- 매일 `00:00 KST`: 예약된 오늘 문제를 공개
- 생성 문제는 별도 AI 검수에서 80점 이상을 받아야 저장
- 검수 실패 시 날짜별 최대 3회 재생성
- 동일 날짜 중복 실행과 15분 이상 멈춘 실행 자동 처리
- 생성 및 실패 이력은 `problem_generation_runs` 테이블에 기록
- 공개 전 문제는 `is_released=false` 상태로 보관되어 사용자 API에서 조회 불가

Vercel 프로젝트의 Production 환경에 16자 이상의 임의 문자열로 `CRON_SECRET`을 설정해야 합니다. Vercel은 이 값을 Cron 요청의 `Authorization: Bearer ...` 헤더로 자동 전송합니다.

수동 보충 실행은 배포 주소에서 다음과 같이 할 수 있습니다.

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.example/api/cron/generate-weekly
```

외부 자료를 참고한 수동 큐레이션 문제는 [Curated Problem Import](docs/CURATED_PROBLEM_FORMAT.md) 형식으로 등록합니다. 외부 문구를 자동 복제하지 않고, 출처를 기록한 자체 문안만 허용합니다.

Vercel Hobby 플랜은 Cron 실행 시간이 설정된 한 시간 안에서 지연될 수 있습니다. 공개 지연 시 `/api/cron/release-daily`를 인증 헤더와 함께 수동 호출할 수 있습니다.

## 운영 문서

- [API 계약](docs/API.md)
- [배포 및 자동화](docs/DEPLOYMENT.md)
- [AI 프롬프트 정책](docs/AI_PROMPTS.md)
- [문제 해결](docs/TROUBLESHOOTING.md)
