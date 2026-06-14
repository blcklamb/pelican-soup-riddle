import { describe, expect, it } from "vitest";
import {
  buildAnswerValidationPrompt,
  buildGameMasterPrompt,
  buildProblemGenerationPrompt,
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
});
