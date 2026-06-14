import { describe, expect, it } from "vitest";
import {
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

describe("problem generation prompt", () => {
  it("rejects arbitrary reveal patterns and requires causal plausibility", () => {
    const prompt = buildProblemGenerationPrompt(["기존 문제"]);
    expect(prompt).toContain("가상 화면");
    expect(prompt).toContain("임의의 규칙");
    expect(prompt).toContain("2~4단계의 명확한 인과관계");
    expect(prompt).toContain("기존 문제");
  });
});
