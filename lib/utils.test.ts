import { describe, expect, it, vi } from "vitest";
import {
  AI_ANSWER_LABELS,
  formatDuration,
  shouldCountQuestion,
} from "@/lib/utils";

describe("formatDuration", () => {
  it("formats a completed session", () => {
    expect(formatDuration("2026-06-14T00:00:00.000Z", "2026-06-14T00:03:42.000Z")).toBe("3분 42초");
  });

  it("uses the current time for an active session", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-14T00:00:09.000Z"));
    expect(formatDuration("2026-06-14T00:00:00.000Z")).toBe("9초");
    vi.useRealTimers();
  });
});

describe("shouldCountQuestion", () => {
  it("does not count an open-ended answer request", () => {
    expect(shouldCountQuestion("invalid_question")).toBe(false);
    expect(AI_ANSWER_LABELS.invalid_question).toBe(
      "질문은 [예/아니오/관련 없음]으로 대답할 수 있는 것만 가능합니다",
    );
  });

  it.each(["yes", "no", "irrelevant"] as const)("counts %s", (answer) => {
    expect(shouldCountQuestion(answer)).toBe(true);
  });
});
