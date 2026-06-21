import { describe, expect, it } from "vitest";
import {
  chooseGenerationTarget,
  getMissingScheduleDates,
  getReleaseTargetDate,
  getWeeklyGenerationStartDate,
  MISSING_WEB_REFERENCE_MESSAGE,
  requireWebReference,
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

describe("requireWebReference", () => {
  it("fails instead of allowing AI-only generation when no web reference exists", () => {
    expect(() => requireWebReference([])).toThrow(MISSING_WEB_REFERENCE_MESSAGE);
  });

  it("returns the first scraped web reference", () => {
    const reference = {
      title: "웹 문제",
      question: "상황 설명",
      answer: "정답 설명",
      sourceUrl: "https://example.com/puzzle",
    };

    expect(requireWebReference([reference])).toBe(reference);
  });
});

describe("weekly generation dates", () => {
  it("starts the Sunday weekly job on the following Monday in Korea", () => {
    expect(
      getWeeklyGenerationStartDate(new Date("2026-06-21T06:00:00.000Z")),
    ).toBe("2026-06-22");
    expect(
      getMissingScheduleDates("2026-06-22", 7, [
        "2026-06-22",
        "2026-06-24",
      ]),
    ).toEqual([
      "2026-06-23",
      "2026-06-25",
      "2026-06-26",
      "2026-06-27",
      "2026-06-28",
    ]);
  });

  it("releases tomorrow at the previous evening cron time", () => {
    expect(getReleaseTargetDate(new Date("2026-06-18T14:30:00.000Z"))).toBe(
      "2026-06-19",
    );
  });
});
