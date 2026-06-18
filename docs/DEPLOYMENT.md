# Deployment

## Database

```bash
supabase link --project-ref <project-ref>
supabase db push
```

자동화에는 다음 migration이 모두 적용되어야 합니다.

- `202606140006_add_daily_problem_automation.sql`
- `202606140007_expand_daily_problem_pipeline.sql`
- `202606140012_add_web_source_generated_problem.sql`

## Vercel environment

Production 환경에 다음 값을 설정합니다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
CRON_SECRET=
SCRAPE_SOURCE_URLS=https://example.com/turtle-soup-1,https://example.com/turtle-soup-2
```

`CRON_SECRET`은 16자 이상의 임의 문자열을 사용합니다. 재배포 후 Vercel Settings > Cron Jobs에서 두 작업을 확인합니다.

- `/api/cron/release-daily`: 매일 `14:30 UTC` (`23:30 KST`)에 다음 날짜 문제 공개
- `/api/cron/generate-weekly`: 일요일 `06:00 UTC` (`15:00 KST`)에 다음 월-일 7일 일정 보충

`SCRAPE_SOURCE_URLS`는 선택값입니다. 설정하면 주간 생성이 공개 웹 페이지에서 `문제:`/`정답:` 형식의 후보를 수집하고, 원문 복제가 아니라 서비스용 문제로 재구성한 뒤 `source='Web'`, `source_url`을 저장합니다. 접근 실패, HTML 형식 불일치, 후보 부족 시 해당 URL은 건너뛰고 AI 신규 생성으로 fallback합니다.

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

Supabase에서 `daily_releases`에 다음 월-일 7일 일정이 존재하고 미래 행이 `is_released=false`인지 확인합니다. 웹 참고 생성은 `problems.source='Web'`와 `source_url`로 확인할 수 있으며, 실행 이력은 `problem_generation_runs`에서 확인합니다.
