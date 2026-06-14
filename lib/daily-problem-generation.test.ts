import { describe, expect, it } from "vitest";
import { chooseGenerationTarget } from "@/lib/daily-problem-generation";

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
