import { describe, expect, it } from "vitest";
import {
  addCalendarDays,
  getCalendarDateRange,
  getKoreanDate,
} from "@/lib/korean-date";

describe("Korean calendar date", () => {
  it("switches dates at midnight in Korea", () => {
    expect(getKoreanDate(new Date("2026-06-14T14:59:59.000Z"))).toBe(
      "2026-06-14",
    );
    expect(getKoreanDate(new Date("2026-06-14T15:00:00.000Z"))).toBe(
      "2026-06-15",
    );
  });

  it("adds days across month boundaries", () => {
    expect(addCalendarDays("2026-06-30", 1)).toBe("2026-07-01");
  });

  it("creates an inclusive schedule range", () => {
    expect(getCalendarDateRange("2026-06-29", 4)).toEqual([
      "2026-06-29",
      "2026-06-30",
      "2026-07-01",
      "2026-07-02",
    ]);
  });
});
