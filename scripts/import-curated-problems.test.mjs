import { describe, expect, it } from "vitest";
import { validateCuratedProblems } from "./import-curated-problems.mjs";

const validProblem = {
  releaseDate: "2026-07-01",
  title: "검증용 문제",
  question: "한 사람이 이상한 행동을 했지만 알고 보면 자연스럽다. 왜 그랬을까?",
  answer: "실제 공개 문제를 참고해 자체 문안으로 다시 작성한 정답 설명입니다.",
  explanation: "상황과 정답의 인과관계를 게임 종료 후 보여 주는 해설입니다.",
  answerKeywords: ["출처", "재작성", "힌트"],
  category: "Logic",
  difficulty: "Medium",
  source: "Web",
  sourceUrl: "https://example.com/source",
  hint1: "첫 번째 방향 힌트입니다.",
  hint2: "두 번째로 조금 더 구체적인 힌트입니다.",
};

describe("validateCuratedProblems", () => {
  it("requires sourceUrl and both hints for web curated problems", () => {
    expect(validateCuratedProblems([validProblem])).toEqual([
      expect.objectContaining({
        source: "Web",
        sourceUrl: "https://example.com/source",
        hint1: "첫 번째 방향 힌트입니다.",
        hint2: "두 번째로 조금 더 구체적인 힌트입니다.",
      }),
    ]);

    expect(() =>
      validateCuratedProblems([{ ...validProblem, sourceUrl: "" }]),
    ).toThrow("Web 문제에는 sourceUrl이 필요합니다");

    expect(() =>
      validateCuratedProblems([{ ...validProblem, hint1: "" }]),
    ).toThrow("hint1 값이 올바르지 않습니다");

    expect(() =>
      validateCuratedProblems([{ ...validProblem, hint2: "짧음" }]),
    ).toThrow("hint2 값이 올바르지 않습니다");
  });
});
