import { describe, expect, it } from "vitest";
import {
  assertQuestionAvailable,
  getRemainingQuestions,
  hasReachedQuestionLimit,
  MAX_QUESTIONS_PER_SESSION,
} from "@/lib/game-policy";

describe("question limit policy", () => {
  it("allows the thirtieth question", () => {
    expect(MAX_QUESTIONS_PER_SESSION).toBe(30);
    expect(getRemainingQuestions(29)).toBe(1);
    expect(hasReachedQuestionLimit(29)).toBe(false);
    expect(() => assertQuestionAvailable(29)).not.toThrow();
  });

  it("blocks questions after all thirty were used", () => {
    expect(getRemainingQuestions(30)).toBe(0);
    expect(hasReachedQuestionLimit(30)).toBe(true);
    expect(() => assertQuestionAvailable(30)).toThrow(
      "질문은 최대 30개까지 가능합니다",
    );
  });

  it("never returns a negative remaining count", () => {
    expect(getRemainingQuestions(31)).toBe(0);
  });
});
