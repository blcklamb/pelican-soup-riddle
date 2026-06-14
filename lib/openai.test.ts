import { describe, expect, it } from "vitest";
import { buildGameMasterPrompt, normalizeAiAnswer } from "@/lib/openai";

describe("game master prompt", () => {
  it("contains the hidden solution and previous conversation", () => {
    const prompt = buildGameMasterPrompt({
      question: "불이 꺼졌다.",
      answer: "등대였다.",
      history: [{ id: "1", role: "user", content: "밤이었나요?", createdAt: "2026-06-14T00:00:00Z" }],
    });
    expect(prompt).toContain("숨겨진 정답: 등대였다.");
    expect(prompt).toContain("플레이어: 밤이었나요?");
    expect(prompt).toContain("yes, no, irrelevant");
  });

  it.each(["yes", "no", "irrelevant"] as const)("preserves valid answer %s", (answer) => {
    expect(normalizeAiAnswer(answer)).toBe(answer);
  });
});
