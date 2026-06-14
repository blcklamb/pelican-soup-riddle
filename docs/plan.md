# 개선 기능 구현 계획

## 개요

이 문서는 다음 세 가지 개선 기능의 구현 방법을 기술한다.

1. 거북의 답변 수신 후 입력란 자동 포커스
2. 질문 10·20개 시 힌트 선택 기능
3. 동시 접속자 100명 이상 대기 기능

---

## 1. 거북의 답변 수신 후 입력란 자동 포커스

### 현황

`components/GameScreen.tsx`의 채팅 입력란은 포커스 관리 없이 상태 갱신만 수행한다.
사용자는 거북의 답변이 돌아올 때마다 입력란을 수동으로 탭하거나 클릭해야 한다.

### 구현 방법

**변경 파일:** `components/GameScreen.tsx`

1. 입력란에 `ref` 추가
   ```ts
   const inputRef = useRef<HTMLInputElement>(null);
   ```

2. `chatMutation`의 `onSuccess` 콜백에서 `setText("")` 직후 포커스 호출
   ```ts
   onSuccess: (data) => {
     queryClient.setQueryData(...);
     setText("");
     inputRef.current?.focus();
   },
   ```

3. `<input>` 요소에 `ref={inputRef}` 추가

### 주의 사항

- 모바일 환경에서 `focus()` 호출은 소프트 키보드를 강제로 올릴 수 있다. `chatMutation.isPending`이 해제된 직후(`onSuccess`, `onError`)에만 호출하여 키보드가 잘못된 타이밍에 열리지 않도록 한다.
- 세션 만료(`sessionExpired`) 또는 질문 한도 초과(`questionLimitReached`) 상태에서는 포커스를 부여하지 않는다.
- 오류 재시도 버튼 클릭 이후에도 동일한 `onSuccess` 경로를 타므로 별도 처리가 불필요하다.

---

## 2. 질문 10·20개 시 힌트 선택 기능

### 현황

- `lib/hints.ts`의 `getAvailableHintLevel`은 `questionCount ≥ 10`이면 1단계, `questionCount ≥ 20`이면 2단계 힌트 해제 조건을 이미 계산한다.
- `components/GameScreen.tsx`는 `session.availableHintLevel`이 있으면 "N단계 힌트 사용" 버튼을 소극적으로 표시한다.
- `app/api/sessions/[sessionId]/hint/route.ts`는 힌트 사용 시 `hint_count`를 올바르게 증가시킨다.

### 구현 목표

질문 수가 10개 또는 20개에 도달하는 순간, 사용자에게 힌트 해제를 명확히 알리는 인라인 배너를 표시한다. 사용자가 "힌트 보기"를 선택해야만 힌트가 열람되고 `hint_count`가 증가한다. 배너를 닫아도 기존 힌트 버튼은 유지된다.

### 구현 방법

**변경 파일:** `components/GameScreen.tsx`

#### 힌트 해제 알림 상태 관리

```ts
const [dismissedHintLevel, setDismissedHintLevel] = useState<1 | 2 | null>(null);
const prevAvailableHintLevelRef = useRef<1 | 2 | null>(null);
const [showHintBanner, setShowHintBanner] = useState(false);

useEffect(() => {
  const prev = prevAvailableHintLevelRef.current;
  const current = session?.availableHintLevel ?? null;
  if (current !== null && current !== prev && current !== dismissedHintLevel) {
    setShowHintBanner(true);
  }
  prevAvailableHintLevelRef.current = current;
}, [session?.availableHintLevel, dismissedHintLevel]);
```

#### 힌트 선택 배너 렌더링

채팅 영역 하단(`<section>` 직후)에 다음 배너를 조건부 렌더링한다:

```
┌─────────────────────────────────────────────┐
│ 💡  N단계 힌트가 열렸습니다!                │
│   [힌트 보기]          [나중에]             │
└─────────────────────────────────────────────┘
```

- **"힌트 보기"** 클릭 → `hintMutation.mutate()` 호출 → `hint_count` 증가 → 대화에 힌트 메시지 추가 → 배너 닫기
- **"나중에"** 클릭 → `setDismissedHintLevel(session.availableHintLevel)` → `setShowHintBanner(false)` → 기존 "N단계 힌트 사용" 버튼은 유지

#### 데이터 흐름

```
questionCount 증가
  → session.availableHintLevel 변화 (null → 1 또는 1 → 2)
  → showHintBanner = true
  → 사용자가 "힌트 보기" 클릭
  → POST /api/sessions/[sessionId]/hint
  → hint_count += 1, 대화에 힌트 메시지 추가
  → session 캐시 갱신
```

### 테스트 기준

- `questionCount`가 10이 되는 시점에 1단계 힌트 배너가 표시되는지 확인
- `questionCount`가 20이 되는 시점에 2단계 힌트 배너가 표시되는지 확인
- "힌트 보기" 클릭 시 `hint_count`가 1씩 증가하는지 확인
- "나중에" 클릭 후에도 기존 힌트 버튼이 유지되는지 확인
- 같은 힌트 단계에서 배너가 중복 표시되지 않는지 확인
- 힌트가 없는 문제(`hint_1`, `hint_2` 미설정)에서 배너가 표시되지 않는지 확인

---

## 3. 동시 접속자 100명 이상 대기 기능

### 현황

세션 생성 API(`POST /api/sessions`)는 요청 즉시 세션을 생성하거나 기존 세션을 반환한다. 동시 접속자 수를 추적하거나 제한하는 장치가 없다.

### 구현 목표

활성 게임 세션 수가 100개 이상이면 신규 사용자에게 대기 화면을 보여주고, 주기적으로 접속 가능 여부를 폴링하여 자리가 생기면 자동으로 게임을 시작한다.

### 구현 방법

#### 3-1. 동시 접속자 집계 및 세션 생성 제어 (서버)

**변경 파일:** `lib/game-service.ts`, `app/api/sessions/route.ts`

`POST /api/sessions` 처리 흐름에 아래 단계를 추가한다:

1. `deviceId` 또는 `userId`로 기존 세션 조회 → 있으면 대기 없이 반환 (기존 동작 유지)
2. 기존 세션이 없으면 활성 세션 수 조회
   ```ts
   const { count } = await supabase
     .from("game_sessions")
     .select("*", { count: "exact", head: true })
     .eq("status", "in_progress")
     .gt("expires_at", new Date().toISOString());
   ```
3. `count < 100`이면 세션 생성 및 반환 (기존 동작)
4. `count ≥ 100`이면 HTTP 503 반환
   ```json
   {
     "code": "WAITING_QUEUE",
     "position": 5,
     "estimatedWaitSeconds": 150
   }
   ```
   - `position`: 초과된 인원 수 (`count - 100 + 1`)
   - `estimatedWaitSeconds`: `position × 평균 세션 잔여 시간(30초)` 으로 산출 (단순 추정)

#### 3-2. 대기 상태 조회 API 추가

**새 파일:** `app/api/queue/route.ts`

```
GET /api/queue?deviceId=...
```

- 활성 세션 수를 조회하고 진입 가능 여부를 반환
- 기존 세션을 보유한 사용자는 즉시 `canEnter: true` 반환
- 응답 형식:
  ```json
  {
    "canEnter": false,
    "position": 5,
    "estimatedWaitSeconds": 150
  }
  ```
- IP 기반 요청 제한 적용 (분당 20회, `enforceRateLimit` 재사용)

#### 3-3. 대기 화면 컴포넌트 추가

**새 파일:** `components/WaitingScreen.tsx`

- 5초마다 `GET /api/queue` 폴링
- `canEnter: true` 수신 시 세션 생성 재시도를 상위 컴포넌트에 콜백으로 알림
- UI 구성:

```
┌──────────────────────────────────────┐
│          잠시 기다려 주세요           │
│                                      │
│      현재 대기 순번: 5번              │
│      예상 대기 시간: 약 2분 30초      │
│                                      │
│         [새로 고침]                   │
└──────────────────────────────────────┘
```

Props:
```ts
interface WaitingScreenProps {
  position: number;
  estimatedWaitSeconds: number;
  onReady: () => void; // canEnter: true 수신 시 호출
}
```

#### 3-4. `GameScreen.tsx` 연동

**변경 파일:** `components/GameScreen.tsx`

```ts
const [waitingState, setWaitingState] = useState<{
  position: number;
  estimatedWaitSeconds: number;
} | null>(null);

// sessionQuery 오류 핸들링
if (sessionQuery.isError) {
  const err = sessionQuery.error as ApiError;
  if (err.code === "WAITING_QUEUE") {
    return (
      <WaitingScreen
        position={err.details.position}
        estimatedWaitSeconds={err.details.estimatedWaitSeconds}
        onReady={() => sessionQuery.refetch()}
      />
    );
  }
  // 기존 오류 화면 유지
}
```

#### 데이터 흐름

```
POST /api/sessions (신규 사용자)
  → 기존 세션 확인 (deviceId/userId)
    → 있으면: 세션 반환 (대기 없음)
  → 없으면: 활성 세션 수 조회
    → count < 100: 세션 생성 및 반환
    → count ≥ 100: 503 WAITING_QUEUE 반환

클라이언트 (WaitingScreen)
  → 5초 간격 GET /api/queue 폴링
  → canEnter: true → POST /api/sessions 재시도 → 게임 시작
```

### 동시성 고려 사항

- 활성 세션 수 조회와 세션 생성 사이에 경쟁 조건이 발생할 수 있으므로, 동시 접속자 100명을 엄격하게 보장하기보다 soft cap으로 운영한다. 104~105명까지 허용될 수 있다.
- 세션 만료(`expires_at`)를 기준으로 집계하므로 클라이언트가 명시적으로 종료하지 않더라도 세션 만료 후 자연적으로 슬롯이 해제된다.
- `enforceRateLimit`을 `GET /api/queue`에 적용하여 폴링 자체가 DoS 벡터가 되지 않도록 한다.

### 테스트 기준

- 활성 세션이 99개일 때 신규 세션 생성 성공 확인
- 활성 세션이 100개일 때 신규 요청에 `503 WAITING_QUEUE` 응답 확인
- 기존 세션 보유자(`deviceId` 일치)는 활성 세션 수와 무관하게 세션 반환 확인
- `GET /api/queue` 분당 20회 초과 시 요청 제한 응답 확인
- 대기 화면에서 5초 폴링 후 `canEnter: true` 수신 시 자동 게임 진입 확인

---

## 적용 순서

| 순서 | 항목 | 변경 범위 | 위험도 |
|------|------|----------|--------|
| 1 | 거북 답변 후 입력란 자동 포커스 | `GameScreen.tsx` 단일 파일 | 낮음 |
| 2 | 힌트 선택 배너 UI | `GameScreen.tsx` (클라이언트 전용, 기존 API 재사용) | 낮음 |
| 3 | 동시 접속자 대기 기능 | 신규 API 라우트, 신규 컴포넌트, 서버 로직 변경 | 보통 |
