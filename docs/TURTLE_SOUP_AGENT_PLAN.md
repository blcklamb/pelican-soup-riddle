# 🐢 Turtle Soup AI Game - Agent Development Plan

**프로젝트 명**: Turtle Soup AI  
**목표**: OpenAI GPT API & Supabase를 활용한 모바일 퍼스트 추리 게임  
**배포 플랫폼**: Vercel  
**개발 순서**: 백엔드 → 프론트엔드 → 통합 테스트 → 배포

---

## 🎯 Phase 1: 데이터 준비 및 백엔드 설계

### 1-1. 초기 10개 문제 데이터 수집

**목표**: 유명한 "바다거북 스프" 문제 10개를 확보하고 Supabase에 시드 데이터로 등록

**작업**:
1. 다음 출처에서 유명한 문제 10개 수집:
   - Namu Wiki: https://namu.wiki/w/바다거북 수프(문제) (맨 위의 10개 클래식 문제)
   - Reddit: r/riddles, r/whatisthisthing의 유명 스레드
   - Black Story 게임 클래식 문제들
   
2. 각 문제마다 다음 정보 정리:
   ```
   {
     id: "problem_001",
     title: "The Man Who Hanged Himself",
     question: "한 남자가 텅 빈 방의 천장에서 목을 매달아 죽었다. 의자, 탁자, 또는 다른 물건은 없었다. 어떻게 그런 일이 가능했을까?",
     answer: "그는 얼음 위에 서 있었고, 시간이 지나면서 얼음이 녹아 죽게 되었다.",
     explanation: "이 문제는 논리적 추론보다는 측정 불가능한 변수에 대한 창의적 사고를 요구합니다. AI는 사용자의 질문을 통해 '얼음', '녹음', '시간' 같은 개념을 유도해야 합니다.",
     category: "Paradox",
     difficulty: "Medium",
     createdAt: "2024-01-01",
     isDaily: false,
     sequence: 1
   }
   ```

3. 문제 검증:
   - 모든 문제가 Yes/No/Not Relevant로 답변 가능한지 확인
   - 정답이 명확하고 객관적인지 확인
   - 한국어 표현이 자연스러운지 검토

**완성 기준**: 
- 10개 문제 데이터 JSON/SQL 파일 생성
- Supabase `problems` 테이블에 시드 데이터 마이그레이션 완료
- 각 문제의 "정답 검증 키워드" 리스트 작성 (정답 인증 AI에 제공용)

---

### 1-2. 데일리 문제 생성 및 관리 시스템

**목표**: 초기 10개 이후, 매일 새로운 문제를 Supabase에 자동 등록하는 방식 구축

**전략**: 
- **주 2회 웹 스크래핑** (월, 목) + **주 5회 AI 자동 생성** (화, 수, 금, 토, 일)
- 목표: 4주 분량(28개) 미리 생성하여 `problems` 테이블에 bulk insert

**작업 A: 웹 스크래핑 (유명 문제)**
1. 스크래핑 대상:
   - Namu Wiki 바다거북 스프 페이지 (중복 제거)
   - Reddit r/riddles의 높은 추천수 게시물
   - 오래된 온라인 게임 아카이브 (Riddle.com 등)

2. 스크래핑 방식:
   - 수동 큐레이션 (AI 보조)
   - Puppeteer/Cheerio로 자동화 스크립트 작성
   - 중복 검사: 기존 10개 + 이미 등록된 문제와 비교

**작업 B: AI 자동 생성**
1. 생성 프롬프트:
   ```
   당신은 바다거북 스프(Turtle Soup) 게임의 문제 작가입니다.
   
   다음 조건을 만족하는 새로운 추리 문제를 생성하세요:
   - 한국어로 작성
   - 처음에는 불가능해 보이지만 합리적인 설명이 있어야 함
   - Yes/No/Not Relevant로 5-15개 질문 내에 풀 수 있어야 함
   - 기존 문제와 중복되지 않음: [기존 문제 제목 리스트]
   - 폭력적/불법적 내용 제외
   
   응답 형식 (JSON):
   {
     "title": "문제 제목",
     "question": "상황 설명 (사용자에게 보여줄 텍스트)",
     "answer": "정답",
     "explanation": "왜 이게 정답인가 (사용자에게 게임 후 보여줄 설명)",
     "difficulty": "Easy|Medium|Hard",
     "category": "Paradox|Weird|Logic|Dark"
   }
   ```

2. 생성 주기:
   - 매주 월요일 자정 (UTC): 다음 4주 분량 28개 문제 일괄 생성
   - 중복 제거 및 품질 검사 자동화

**작업 C: daily_releases 테이블 관리**
1. Supabase Functions (또는 Cloud Functions) 생성:
   ```
   - daily_release_trigger()
   - 매일 00:00 UTC 실행
   - problems 테이블에서 isDaily=true && createdAt=today인 문제 찾기
   - daily_releases 테이블에 레코드 삽입
   - 실패 시 로깅 + 알림
   ```

2. 문제 활성화 로직:
   - API 응답 시 `daily_releases`에 등록된 문제만 홈에 표시

**완성 기준**:
- Supabase Functions로 자동 daily release 구현
- 4주 분량(28개) 문제 프리로드 완료
- 스크래핑/AI 생성 스크립트 문서화 (수동 실행용)

---

## 📱 Phase 2: 프론트엔드 개발

### 2-1. 프로젝트 초기화 및 구조

**기술 스택**:
```
- Framework: Next.js 14+ (App Router)
- UI: Tailwind CSS + Headless UI
- 상태관리: React Query (TanStack Query)
- API 클라이언트: TanStack Query + fetch
- 타입: TypeScript (strict mode)
- 배포: Vercel
```

**디렉토리 구조**:
```
turtle-soup-ai/
├── app/
│   ├── layout.tsx                  # 루트 레이아웃
│   ├── page.tsx                    # 홈 화면
│   ├── game/
│   │   └── [problemId]/
│   │       └── page.tsx            # 게임 플레이 화면
│   ├── archive/
│   │   ├── page.tsx                # 과거 문제 목록
│   │   └── [problemId]/
│   │       └── page.tsx            # 과거 문제 상세
│   └── api/
│       ├── game/route.ts           # 게임 세션 CRUD
│       ├── chat/route.ts           # AI 질문 응답
│       ├── validate-answer/route.ts # 정답 검증
│       └── problems/route.ts       # 문제 조회
├── lib/
│   ├── supabase.ts                 # Supabase 클라이언트
│   ├── openai.ts                   # OpenAI API 클라이언트
│   ├── hooks.ts                    # 커스텀 훅 (useGame, useChat 등)
│   └── types.ts                    # TypeScript 타입 정의
├── components/
│   ├── ChatBubble.tsx              # 메시지 버블
│   ├── MessageInput.tsx            # 입력 필드
│   ├── GameHeader.tsx              # 게임 헤더
│   ├── AnswerModal.tsx             # 정답 모달
│   └── ProblemCard.tsx             # 문제 카드
├── public/
│   └── icons/
└── .env.local                      # 환경 변수
```

**환경 변수 (.env.local)**:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_KEY=xxxxx (서버 사이드용)
OPENAI_API_KEY=sk-xxxxx
OPENAI_MODEL=gpt-4o-mini (또는 gpt-4-turbo)
```

**완성 기준**:
- Next.js 프로젝트 초기화 완료
- Supabase 클라이언트 연결 테스트
- OpenAI 클라이언트 연결 테스트
- TypeScript 설정 (strict mode)

---

### 2-2. 홈 화면 (/)

**기능**:
1. 오늘의 문제 표시 (가장 최근의 daily release)
2. 문제 카드: 제목 + "시작하기" 버튼
3. "과거 문제들" 링크 → /archive로 이동
4. 현재 사용자가 푼 문제 수 표시 (선택사항)

**API 호출**:
```
GET /api/problems?type=daily
→ 응답: { id, title, category, difficulty }
```

**상태 관리**:
```typescript
interface HomePageState {
  dailyProblem: Problem | null;
  solvedCount: number;
  loading: boolean;
}
```

**모바일 최적화**:
- 뷰포트 높이 100% (아이폰 홈 바 고려)
- 카드 패딩: 16px (좌우 여백)
- 폰트 크기: 문제 제목 18px, 버튼 텍스트 16px
- 터치 타겟: 최소 48px × 48px

**완성 기준**:
- 오늘의 문제 동적 로드
- 반응형 카드 레이아웃
- 로딩 상태 표시 (스켈레톤 로더)

---

### 2-3. 게임 플레이 화면 (/game/[problemId])

**레이아웃** (카카오 메신저 형태):
```
┌─────────────────────────┐
│ [문제 제목] [질문 수: 3] │  ← 고정 헤더
├─────────────────────────┤
│                         │
│  "한 남자가 목을 매달아" │
│  "죽었다. 의자는 없었다."│  ← 문제 설명 (고정)
│                         │
├─────────────────────────┤
│                         │
│          ┌──────────┐   │
│          │그는 마술사?│   │  ← 사용자 메시지 (우측)
│          └──────────┘   │
│                         │
│  🐢 ┌──────────┐        │
│     │    예    │        │  ← AI 메시지 (좌측, 거북이 프로필)
│     └──────────┘        │
│                         │
│          ┌──────────┐   │
│          │다른 사람이 │   │  ← 사용자 메시지 (우측)
│          │ 밀었나?   │   │
│          └──────────┘   │
│                         │
│  🐢 ┌──────────┐        │
│     │ 관련 없음 │        │  ← AI 메시지 (좌측, 거북이 프로필)
│     └──────────┘        │
│                         │ ← 스크롤 가능
│                         │
├─────────────────────────┤
│ [입력 필드: 질문 입력...] │
│ [전송] [정답 말하기] [포기]│ ← 고정 푸터
└─────────────────────────┘
```

**기능**:
1. 문제 설명 상단 고정
2. 채팅 히스토리 스크롤 (자동 하단 정렬)
3. 질문 입력 및 전송
4. "정답 말하기" → 모달 오픈
5. "포기하기" → 정답 공개 후 게임 종료

**상태 관리**:
```typescript
interface GameState {
  gameSessionId: string;
  problemId: string;
  conversationHistory: Message[];
  questionCount: number;
  isLoading: boolean;
  status: "InProgress" | "Solved" | "GivenUp";
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}
```

**AI 질문 응답 API**:
```
POST /api/chat
Body: {
  gameSessionId: string,
  problemId: string,
  userMessage: string,
  conversationHistory: Message[]
}

응답:
{
  response: "예" | "아니오" | "관련 없음",
  timestamp: number
}

Error Handling:
- OpenAI API 타임아웃 (5초): "응답이 지연되고 있습니다..."
- Rate limit: "너무 많은 요청이 들어왔습니다..."
- Invalid input: "질문을 입력해주세요"
```

**채팅 UI 상세** (카카오 메신저 스타일):
- **AI 메시지**: 좌측 정렬, 회색 배경 (#E5E5EA), 둥근 모서리 (border-radius: 16px)
  - 프로필 아이콘: 🐢 (거북이 이모지)
  - 프로필 크기: 32px × 32px
  - 메시지 좌측에 프로필 표시
- **사용자 메시지**: 우측 정렬, 파란 배경 (#4A7BF7), 둥근 모서리 (border-radius: 16px)
  - 프로필 아이콘: 없음 (사용자 이름이나 구분 방식 선택)
- 메시지 패딩: 좌우 12px, 상하 8px
- 메시지 간 마진: 4px
- 타임스탠프: 선택사항 (메시지 길게 눌러서 표시)
- 로딩 중: AI 메시지 위치에 "..." 애니메이션 (좌측, 프로필 옆)

**모바일 최적화**:
- 입력 필드 활성화 시 자동 스크롤 (최하단)
- 키보드 팝업 시 채팅 영역 수축
- 버튼 높이: 44px (iOS 가이드라인)
- 터치 피드백: 버튼 클릭 시 opacity 0.7

**완성 기준**:
- 채팅 UI 렌더링
- AI 응답 API 통합
- 자동 스크롤 & 키보드 처리
- 에러 상황별 UX 구현

---

### 2-4. 정답 검증 시스템

**기능**: 사용자가 입력한 정답이 "정답과 맥락이 일치"하는지 AI API로 검증

**API 엔드포인트**:
```
POST /api/validate-answer
Body: {
  gameSessionId: string,
  problemId: string,
  userAnswer: string,
  actualAnswer: string (서버에서만 접근)
}

응답:
{
  isCorrect: boolean,
  confidence: 0.0-1.0,
  feedback: "정답입니다! 🎉" | "거의 맞혔어요" | "틀렸습니다"
}
```

**검증 프롬프트**:
```
당신은 추리 게임의 정답 평가자입니다.

사용자가 제시한 답변:
"${userAnswer}"

게임의 정답:
"${actualAnswer}"

평가 기준:
1. 핵심 개념이 일치하는가? (예: "얼음" vs "빙판")
2. 논리적 메커니즘이 일치하는가?
3. 불필요한 세부사항 차이는 무시 (예: "남자가" vs "한 남자가")

응답 형식 (JSON):
{
  "isCorrect": true/false,
  "confidence": 0.85,
  "explanation": "당신의 답변이 정확합니다. 핵심 개념인 '얼음이 녹음'을 이해했습니다."
}
```

**완성 기준**:
- 정답 검증 API 구현
- 신뢰도 기반 피드백 로직
- 서버 사이드에서 실제 정답 보호 (클라이언트에 노출 X)

---

### 2-5. 정답 모달 (게임 완료)

**표시 내용**:
```
┌──────────────────────┐
│      🎉 정답입니다!   │
├──────────────────────┤
│ 정답: [실제 정답]    │
│                      │
│ 왜 이게 정답인가:    │
│ [설명 텍스트]        │
├──────────────────────┤
│ 통계:                │
│ • 질문 수: 5개       │
│ • 소요 시간: 3분 42초 │
│ • 어려움: Medium     │
├──────────────────────┤
│ [다시 풀기] [다음]   │
└──────────────────────┘
```

**기능**:
- "다시 풀기": 같은 문제 재시작 (conversationHistory 초기화)
- "다음": /archive로 이동 또는 홈으로 이동

**완성 기준**:
- 모달 렌더링
- 통계 계산 (소요 시간 포함)
- 버튼 네비게이션

---

### 2-6. 과거 문제 목록 (/archive)

**레이아웃**:
```
┌──────────────────────────┐
│      지난 문제들 (10)    │
├──────────────────────────┤
│ 2024-01-20 (오늘)       │
│ ├─ 1. 매달린 남자        │
│ │  ✅ 5개 질문 (3m 42s) │
│ │                       │
│ 2024-01-19 (어제)       │
│ ├─ 2. 호텔의 열쇠       │
│ │  ⏳ 진행 중           │
│ │                       │
│ 2024-01-18             │
│ ├─ 3. 침대 위의 물       │
│ │  ❌ 포기 (8개 질문)   │
│ │                       │
│ ...                     │
└──────────────────────────┘
```

**기능**:
1. 날짜별 그룹핑 (최신순)
2. 각 문제 상태 아이콘:
   - ✅ Solved (푼 문제)
   - ⏳ InProgress (진행 중)
   - ❌ GivenUp (포기)
3. 문제 클릭 → /archive/[problemId]로 이동

**상태 관리**:
```typescript
interface ArchivePageState {
  sessions: GameSession[];
  groupedByDate: Record<string, GameSession[]>;
}
```

**API 호출**:
```
GET /api/game?deviceId=xxx&status=all
→ 응답: GameSession[]
```

**완성 기준**:
- 게임 세션 목록 로드
- 날짜별 정렬 & 그룹핑
- 상태별 아이콘 표시

---

### 2-7. 과거 문제 상세 (/archive/[problemId])

**기능**:
1. 지난 게임의 대화 히스토리 재열람 (수정 불가)
2. 정답과 설명 표시
3. 통계 (질문 수, 소요 시간, 날짜)

**레이아웃**:
```
게임 플레이 화면과 동일하되, 입력 필드와 버튼 없음
(읽기 전용 모드)
```

**완성 기준**:
- 과거 게임 세션 로드
- 히스토리 렌더링
- 정답 표시

---

## 🔧 Phase 3: API & 백엔드 로직

### 3-1. API 엔드포인트 정의

**1. GET /api/problems**
```
Query: ?type=daily|initial|all
응답: Problem[]
설명: 문제 목록 조회
```

**2. POST /api/game**
```
Body: { problemId, deviceId }
응답: { gameSessionId, problem }
설명: 게임 세션 시작
```

**3. POST /api/chat**
```
Body: { 
  gameSessionId, 
  problemId, 
  userMessage,
  conversationHistory 
}
응답: { response, timestamp }
설명: AI 질문 응답
```

**4. POST /api/validate-answer**
```
Body: { gameSessionId, userAnswer }
응답: { isCorrect, confidence, feedback }
설명: 정답 검증
```

**5. GET /api/game**
```
Query: ?deviceId=xxx&status=all|solved|inProgress
응답: GameSession[]
설명: 사용자의 모든 게임 세션 조회
```

**6. GET /api/game/[sessionId]**
```
응답: GameSession (conversationHistory 포함)
설명: 특정 게임 세션 상세 조회
```

### 3-2. deviceId 관리

**목표**: 로그인 없이 사용자 식별 (로컬 저장소 활용)

**구현**:
```typescript
// lib/device.ts
export function getOrCreateDeviceId(): string {
  const stored = localStorage.getItem("turtle_soup_device_id");
  if (stored) return stored;
  
  const newId = crypto.randomUUID();
  localStorage.setItem("turtle_soup_device_id", newId);
  return newId;
}
```

**주의사항**:
- 브라우저 쿠키 vs 로컬스토리지: 로컬스토리지 사용 (더 오래 지속)
- 시크릿 모드: 각 세션마다 새 deviceId
- 서버: deviceId를 통해 사용자 식별 (인증 필요 없음)

### 3-3. AI 응답 로직 (OpenAI Integration)

**시스템 프롬프트**:
```
당신은 추리 게임 "바다거북 스프"의 게임 마스터입니다.

역할:
- 주어진 상황에 대해 사용자의 질문에만 답변
- 자신의 추론 과정이나 조언은 절대 제공하지 않기
- 일관성 있는 답변 유지

응답 규칙:
1. 질문이 상황과 관련이 있으면: "예" 또는 "아니오"
2. 질문이 상황과 무관하면: "관련 없음"
3. 항상 3가지 중 하나로만 답변 (다른 말은 절대 추가하지 않음)
4. 이유 설명, 힌트, 추가 정보는 제공하지 않기
5. 일관성 유지 (모순된 답변 금지)

현재 상황:
${problem.question}

대화 히스토리:
${conversationHistory.map(m => `${m.role === 'user' ? '사용자' : 'AI'}: ${m.content}`).join('\n')}

사용자 질문:
${userMessage}

당신의 답변 (예 / 아니오 / 관련 없음 중 하나만):
```

**API 호출 코드**:
```typescript
async function getAIResponse(
  systemPrompt: string,
  userMessage: string,
  conversationHistory: Message[]
): Promise<string> {
  const messages = [
    ...conversationHistory.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content
    })),
    { role: "user", content: userMessage }
  ];

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages
    ],
    max_tokens: 50,
    temperature: 0.3 // 일관성을 위해 낮게 설정
  });

  const content = response.choices[0].message.content?.trim() || "";
  
  // "예", "아니오", "관련 없음" 중 하나만 추출
  if (content.includes("예")) return "예";
  if (content.includes("아니오")) return "아니오";
  if (content.includes("관련 없음")) return "관련 없음";
  
  return "관련 없음"; // 기본값
}
```

**오류 처리**:
- 타임아웃 (5초): "AI가 응답할 수 없습니다. 다시 시도해주세요."
- Rate limit: "너무 많은 요청이 들어왔습니다. 잠시 후 다시 시도해주세요."
- API 키 무효: 서버 로그에만 남기고, 사용자에게는 일반 에러 메시지

### 3-4. 정답 검증 로직

**시스템 프롬프트**:
```
당신은 추리 게임의 정답 평가자입니다.

사용자 답변:
"${userAnswer}"

게임의 정답:
"${actualAnswer}"

평가 기준:
1. 핵심 개념이 일치하는가?
2. 논리적 메커니즘이 일치하는가?
3. 세부 표현 차이는 무시 (예: "남자" vs "한 남자")
4. 순서나 문법 차이는 무시

응답 (JSON만):
{
  "isCorrect": true/false,
  "confidence": 0.0-1.0,
  "explanation": "평가 이유"
}
```

**API 호출**:
```typescript
async function validateAnswer(
  userAnswer: string,
  actualAnswer: string
): Promise<{ isCorrect: boolean; confidence: number }> {
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `사용자 답변: "${userAnswer}"\n정답: "${actualAnswer}"\n\n위 두 답변이 같은 의미인지 판단하고 JSON으로 응답: {"isCorrect": boolean, "confidence": number}`
      }
    ],
    max_tokens: 100,
    temperature: 0.2
  });

  const text = response.choices[0].message.content || "{}";
  const json = JSON.parse(text);
  
  return {
    isCorrect: json.isCorrect && json.confidence > 0.7,
    confidence: json.confidence
  };
}
```

---

## 🗄️ Phase 4: Supabase 데이터베이스 설계

### 4-1. 테이블 스키마

**problems 테이블**:
```sql
CREATE TABLE problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  category TEXT CHECK (category IN ('Paradox', 'Weird', 'Logic', 'Dark')),
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_daily BOOLEAN DEFAULT false,
  sequence INTEGER,
  source TEXT -- "Web" | "AI" | "Manual"
);

CREATE INDEX idx_problems_is_daily ON problems(is_daily);
CREATE INDEX idx_problems_created_at ON problems(created_at DESC);
```

**game_sessions 테이블**:
```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  problem_id UUID REFERENCES problems(id),
  conversation_history JSONB DEFAULT '[]',
  status TEXT CHECK (status IN ('InProgress', 'Solved', 'GivenUp')),
  question_count INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  solved_at TIMESTAMP,
  gave_up_at TIMESTAMP,
  solution_revealed TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_game_sessions_device_id ON game_sessions(device_id);
CREATE INDEX idx_game_sessions_problem_id ON game_sessions(problem_id);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_game_sessions_created_at ON game_sessions(created_at DESC);
```

**daily_releases 테이블**:
```sql
CREATE TABLE daily_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  problem_id UUID REFERENCES problems(id),
  is_released BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_releases_date ON daily_releases(date DESC);
```

### 4-2. Row Level Security (RLS)

```sql
-- problems: 모든 사용자가 읽기 가능
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Select problems" ON problems FOR SELECT USING (true);

-- game_sessions: 자신의 세션만 읽기/쓰기
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Select own sessions" ON game_sessions 
  FOR SELECT USING (device_id = current_user_id());
CREATE POLICY "Insert own sessions" ON game_sessions 
  FOR INSERT WITH CHECK (device_id = current_user_id());
CREATE POLICY "Update own sessions" ON game_sessions 
  FOR UPDATE USING (device_id = current_user_id());

-- daily_releases: 모든 사용자가 읽기 가능
ALTER TABLE daily_releases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Select daily releases" ON daily_releases FOR SELECT USING (true);
```

**참고**: RLS는 Supabase 클라이언트 레벨에서만 적용되므로, 서버 API에서는 SERVICE_KEY를 사용하여 모든 데이터에 접근 가능

---

## ⚙️ Phase 5: Supabase 자동화 (Functions & Triggers)

### 5-1. Daily Release Function

**목표**: 매일 00:00 UTC에 새로운 문제를 활성화

```sql
CREATE OR REPLACE FUNCTION release_daily_problem()
RETURNS void AS $$
BEGIN
  -- 오늘 날짜의 미해제 문제 찾기
  UPDATE daily_releases 
  SET is_released = true 
  WHERE date = CURRENT_DATE 
    AND is_released = false;
  
  -- 로깅 (선택사항)
  INSERT INTO release_logs (event, executed_at)
  VALUES ('daily_problem_released', CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;
```

**Trigger 설정** (Supabase 대시보드 또는 cron):
- Supabase는 기본 pg_cron을 지원하지 않으므로, 다음 방법 사용:
  1. **외부 스케줄러**: GitHub Actions / AWS Lambda
  2. **Vercel Cron**: Next.js API route로 구현

**추천: Vercel Cron** (가장 간단)
```typescript
// app/api/cron/release-daily.ts
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createServiceClient();
  
  // 오늘 날짜에 해당하는 문제 활성화
  const { data, error } = await supabase
    .from("daily_releases")
    .update({ is_released: true })
    .eq("date", new Date().toISOString().split("T")[0])
    .eq("is_released", false);

  return Response.json({ success: !error });
}
```

**Vercel vercel.json 설정**:
```json
{
  "crons": [{
    "path": "/api/cron/release-daily",
    "schedule": "0 0 * * *"
  }]
}
```

### 5-2. 문제 자동 생성 Function (월요일)

```typescript
// app/api/cron/generate-weekly.ts
export async function POST(request: Request) {
  // 인증 확인
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const today = new Date();
  if (today.getDay() !== 1) { // 월요일이 아니면 중단
    return Response.json({ skipped: true });
  }

  // 다음 4주 분량(28개) 문제 생성
  const problems = [];
  for (let i = 0; i < 28; i++) {
    const problem = await generateProblemWithAI();
    problems.push(problem);
  }

  // Supabase에 insert
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("problems")
    .insert(problems);

  // daily_releases에도 스케줄 추가
  const releases = problems.map((p, idx) => ({
    date: getDateAfterDays(today, idx),
    problem_id: p.id,
    is_released: false
  }));

  await supabase
    .from("daily_releases")
    .insert(releases);

  return Response.json({ created: problems.length });
}
```

---

## 🚀 Phase 6: 배포 (Vercel)

### 6-1. 배포 전 체크리스트

- [ ] 모든 환경 변수 설정 (Vercel 프로젝트 설정)
- [ ] Supabase 데이터베이스 마이그레이션 완료
- [ ] OpenAI API 키 유효성 확인
- [ ] 초기 10개 문제 시드 데이터 등록
- [ ] 로컬 테스트 완료 (npm run dev)
- [ ] 빌드 테스트 완료 (npm run build)

### 6-2. Vercel 배포

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 배포
vercel

# 3. 환경 변수 설정 (Vercel 대시보드)
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_KEY
# - OPENAI_API_KEY
# - CRON_SECRET

# 4. 배포 확인
vercel --prod
```

### 6-3. 배포 후 확인

- [ ] 홈 페이지 로드 확인
- [ ] 오늘의 문제 표시 확인
- [ ] 게임 플레이 테스트
- [ ] 과거 문제 조회 테스트
- [ ] 모바일 반응형 확인 (iPhone SE 기준)

---

## 📊 Phase 7: 선택사항 기능 (MVP 이후)

### 7-1. 통계 & 분석
- 총 푼 문제 수
- 평균 질문 수
- 카테고리별 통계
- 시간대별 플레이 분포

### 7-2. 공유 기능
- "X개 질문으로 풀었어요! 🎉" 이미지 생성 & 공유
- Twitter / KakaoTalk 공유 버튼

### 7-3. 리더보드 (선택사항)
- 전체 사용자 중 가장 빠른 풀이 시간
- 가장 적은 질문으로 푼 사용자

### 7-4. 사용자 피드백
- 문제 평가 (쉬움/어려움)
- 버그 리포트

---

## 📋 개발 우선순위

**Sprint 1 (Week 1-2)**:
1. Supabase 테이블 설계 & 마이그레이션
2. 초기 10개 문제 데이터 준비
3. Next.js 프로젝트 초기화
4. API 엔드포인트 기본 구조

**Sprint 2 (Week 2-3)**:
1. 홈 화면 UI
2. 게임 플레이 화면 UI
3. OpenAI Integration (AI 질문 응답)
4. 정답 검증 로직

**Sprint 3 (Week 3-4)**:
1. 과거 문제 페이지
2. Supabase 자동화 (daily release, AI 생성)
3. 통합 테스트
4. 모바일 반응형 최종 검토

**Sprint 4 (Week 4)**:
1. 배포 전 최종 점검
2. Vercel 배포
3. 모니터링 & 버그 수정

---

## 🎯 성공 기준

- ✅ 초기 10개 문제 + 4주 분량(28개) 프리로드
- ✅ AI 응답 정확도 95% 이상 (예/아니오/관련 없음)
- ✅ 모바일 기준 로딩 시간 2초 이내
- ✅ API 응답 시간 평균 1.5초 이내
- ✅ 사용자 정답 검증 신뢰도 90% 이상
- ✅ 모든 주요 기능 모바일 테스트 완료

---

## 📝 기술 문서

- **API Documentation**: 각 엔드포인트의 요청/응답 스키마 정리
- **Database Schema**: Supabase 마이그레이션 스크립트
- **AI Prompts**: 시스템 프롬프트 및 최적화 로그
- **Deployment Guide**: Vercel 배포 및 운영 매뉴얼
- **Troubleshooting**: 일반적인 문제와 해결 방법

---

## 🔗 참고 링크

- 바다거북 스프 위키: https://namu.wiki/w/바다거북 수프(문제)
- Black Story (참고 게임): https://blackstory.realworld.to/tutorial
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- OpenAI API: https://platform.openai.com/docs

---

**버전**: 1.0 Final
