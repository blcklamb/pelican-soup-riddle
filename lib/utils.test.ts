import { describe, expect, it, vi } from "vitest";
import { formatDuration } from "@/lib/utils";

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
