# API

모든 요청과 응답은 JSON입니다. 세션 API는 `deviceId`와 DB의 `device_id`가 일치해야 합니다.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/problems/daily` | 한국 날짜 기준 최신 공개 문제 |
| GET | `/api/problems` | 공개된 문제 목록 |
| POST | `/api/sessions` | 진행 중 세션 재개 또는 새 세션 생성 |
| GET | `/api/sessions?deviceId=...` | 기기별 세션 목록 |
| GET | `/api/sessions/[sessionId]?deviceId=...` | 소유권 확인 후 세션 상세 |
| POST | `/api/chat` | 질문을 `예/아니오/관련 없음`으로 판정하고 저장 |
| POST | `/api/answers` | 최종 정답 검증 |
| POST | `/api/sessions/[sessionId]/give-up` | 포기 후 정답 공개 |
| POST | `/api/sessions/[sessionId]/extend` | 만료 세션 20분 연장 |
| GET | `/api/cron/release-daily` | 오늘 예약 문제 공개 |
| GET | `/api/cron/generate-weekly` | 28일 일정의 빈 날짜 생성 |
| GET | `/api/cron/generate-daily` | 오늘/내일 긴급 보충 |

Cron API는 `Authorization: Bearer $CRON_SECRET`이 필요합니다.

주요 상태 코드는 `400` 입력 오류, `401` Cron 인증 실패, `404` 리소스 없음, `409` 세션 상태 충돌, `429` rate limit, `503` 외부 AI 서비스 장애, `504` AI timeout입니다.
