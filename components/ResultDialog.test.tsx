import { describe, expect, it } from "vitest";
import { getResultShareText } from "@/components/ResultDialog";

describe("result sharing", () => {
  it("describes solved sessions as solved", () => {
    expect(
      getResultShareText({ status: "solved", questionCount: 12, hintCount: 1 }),
    ).toContain("해결했어요");
  });

  it("does not describe given-up sessions as solved", () => {
    const text = getResultShareText({
      status: "given_up",
      questionCount: 8,
      hintCount: 0,
    });
    expect(text).toContain("진실을 확인했어요");
    expect(text).not.toContain("해결했어요");
  });
});
