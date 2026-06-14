# Troubleshooting

## 오늘 문제가 바뀌지 않음

1. Vercel Cron Jobs에서 `/api/cron/release-daily` 실행 기록 확인
2. `daily_releases`에 오늘 한국 날짜 행이 있는지 확인
3. 해당 행의 `is_released` 확인
4. 인증된 Cron URL을 수동 호출

## 28일 일정이 채워지지 않음

`problem_generation_runs`에서 `failed` 행의 `message`를 확인합니다. OpenAI quota, timeout, 품질 검수 실패가 주요 원인입니다. 문제를 해결한 뒤 `/api/cron/generate-weekly`를 다시 호출하면 빈 날짜만 보충합니다.

## Cron 401

Vercel Production의 `CRON_SECRET` 설정 후 재배포했는지 확인합니다. 수동 호출에는 동일한 값을 Bearer 토큰으로 전달합니다.

## AI 429 또는 504

429는 요청량 제한, 504는 20초 timeout입니다. 잠시 후 다시 시도합니다. 주간 생성은 날짜별 실패를 기록하므로 재실행 시 빈 날짜만 생성합니다.

## 모바일에서 device ID 생성 실패

`crypto.randomUUID()`가 없는 브라우저는 `getRandomValues()` 기반 UUID v4 fallback을 사용합니다. localStorage가 차단된 브라우저에서는 기록 보존이 제한될 수 있습니다.
