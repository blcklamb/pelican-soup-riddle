import { describe, expect, it } from "vitest";
import {
  chooseGenerationTarget,
  getMissingScheduleDates,
} from "@/lib/daily-problem-generation";

describe("chooseGenerationTarget", () => {
  it("repairs a missing problem for today first", () => {
    expect(chooseGenerationTarget("2026-06-14", ["2026-06-15"])).toBe(
      "2026-06-14",
    );
  });

  it("pre-generates tomorrow when today is covered", () => {
    expect(chooseGenerationTarget("2026-06-14", ["2026-06-14"])).toBe(
      "2026-06-15",
    );
  });

  it("skips generation when today and tomorrow are covered", () => {
    expect(
      chooseGenerationTarget("2026-06-14", ["2026-06-14", "2026-06-15"]),
    ).toBeNull();
  });
});

describe("getMissingScheduleDates", () => {
  it("returns only uncovered dates within the 28-day horizon", () => {
    expect(
      getMissingScheduleDates("2026-06-14", 4, [
        "2026-06-14",
        "2026-06-16",
        "2026-07-30",
      ]),
    ).toEqual(["2026-06-15", "2026-06-17"]);
  });
});
