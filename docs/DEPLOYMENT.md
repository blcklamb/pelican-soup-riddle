# Deployment

## Database

```bash
supabase link --project-ref <project-ref>
supabase db push
```

자동화에는 다음 migration이 모두 적용되어야 합니다.

- `202606140006_add_daily_problem_automation.sql`
- `202606140007_expand_daily_problem_pipeline.sql`

## Vercel environment

Production 환경에 다음 값을 설정합니다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
CRON_SECRET=
```

`CRON_SECRET`은 16자 이상의 임의 문자열을 사용합니다. 재배포 후 Vercel Settings > Cron Jobs에서 두 작업을 확인합니다.

- `/api/cron/release-daily`: 매일 `15:00 UTC` (`00:00 KST`)
- `/api/cron/generate-weekly`: 일요일 `15:10 UTC` (월요일 `00:10 KST`)

## Verification

```bash
npm run lint
npm test
npm run build
```

배포 후 인증된 수동 요청으로 응답을 확인합니다.

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.example/api/cron/generate-weekly
```

Supabase에서 `daily_releases`에 28일 일정이 존재하고 미래 행이 `is_released=false`인지 확인합니다. 실행 이력은 `problem_generation_runs`에서 확인합니다.
