import { describe, expect, it } from "vitest";
import {
  buildAnswerValidationPrompt,
  buildGameMasterPrompt,
  buildProblemGenerationPrompt,
  buildProblemReviewPrompt,
  normalizeAiAnswer,
} from "@/lib/openai";

describe("game master prompt", () => {
  it("contains the hidden solution and previous conversation", () => {
    const prompt = buildGameMasterPrompt({
      question: "불이 꺼졌다.",
      answer: "등대였다.",
      history: [{ id: "1", role: "user", content: "밤이었나요?", createdAt: "2026-06-14T00:00:00Z" }],
    });
    expect(prompt).toContain("숨겨진 정답: 등대였다.");
    expect(prompt).toContain("플레이어: 밤이었나요?");
    expect(prompt).toContain("invalid_question, yes, no, irrelevant");
    expect(prompt).toContain("어떤 문인가요?");
    expect(prompt).toContain("개방형 질문은 반드시 invalid_question");
  });

  it.each(["yes", "no", "irrelevant", "invalid_question"] as const)(
    "preserves valid answer %s",
    (answer) => {
      expect(normalizeAiAnswer(answer)).toBe(answer);
    },
  );
});

describe("answer validation prompt", () => {
  it("accepts compatible imaginative details when the core context matches", () => {
    const prompt = buildAnswerValidationPrompt({
      question: "남자는 수프를 먹고 자살했다. 왜일까?",
      actualAnswer: "과거에 인육을 바다거북 수프라고 속아 먹었다는 사실을 깨달았다.",
      keywords: ["조난", "인육", "바다거북 수프"],
    });

    expect(prompt).toContain("상상해 덧붙였더라도");
    expect(prompt).toContain("핵심 맥락과 양립");
    expect(prompt).toContain("직접 모순");
    expect(prompt).toContain("체크리스트가 아닙니다");
    expect(prompt).toContain("confidence를 0.7 이상");
    expect(prompt).toContain("핵심 키워드: 조난, 인육, 바다거북 수프");
  });

  it("distinguishes harmless additions from a different causal mechanism", () => {
    const prompt = buildAnswerValidationPrompt({
      question: "문제",
      actualAnswer: "정답",
      keywords: [],
    });

    expect(prompt).toContain("같은 방식으로 설명");
    expect(prompt).toContain("핵심 메커니즘을 다른 원인으로 바꾸는 경우");
    expect(prompt).toContain("핵심 키워드: 없음");
  });
});

describe("problem generation prompt", () => {
  it("rejects arbitrary reveal patterns and requires causal plausibility", () => {
    const prompt = buildProblemGenerationPrompt(["기존 문제"]);
    expect(prompt).toContain("가상 화면");
    expect(prompt).toContain("임의의 규칙");
    expect(prompt).toContain("2~4단계의 명확한 인과관계");
    expect(prompt).toContain("기존 문제");
  });

  it("includes safety, originality, clues, and retry feedback", () => {
    const prompt = buildProblemGenerationPrompt(
      ["기존 문제"],
      ["핵심 인과관계가 약합니다."],
    );

    expect(prompt).toContain("완전히 새로운 문제");
    expect(prompt).toContain("관찰 가능한 단서");
    expect(prompt).toContain("잔혹한 신체 훼손");
    expect(prompt).toContain("핵심 인과관계가 약합니다.");
  });

  it("requires an independent review score of at least 80", () => {
    const prompt = buildProblemReviewPrompt({
      candidate: {
        title: "멈춘 전광판",
        question:
          "역의 전광판이 멈춘 것을 본 남자는 열차가 정상 운행 중인데도 곧바로 역무원을 불렀다. 전광판에는 평범한 시각만 표시되어 있었다. 왜 그랬을까?",
        answer:
          "남자는 매일 같은 시각에 숫자가 바뀌는 전광판을 관리했다. 표시가 그대로인 것은 내부 시계가 멈췄다는 뜻이었고, 비상 안내도 표시되지 않을 수 있어 역무원을 불렀다.",
        explanation:
          "평범한 숫자 자체가 아니라 정해진 시각에도 숫자가 변하지 않은 것이 고장의 단서였다.",
        answerKeywords: ["전광판", "시계", "고장"],
        category: "Logic",
        difficulty: "Easy",
      },
      existingProblems: [{ title: "기존 문제", question: "기존 질문입니다." }],
    });

    expect(prompt).toContain("score가 80 이상");
    expect(prompt).toContain("핵심 장치가 중복");
    expect(prompt).toContain("기존 문제");
  });
});
