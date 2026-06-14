import { describe, expect, it } from "vitest";
import { buildPastProblemEntries } from "@/lib/problem-history";
import type { GameSession, PublicProblem } from "@/lib/types";

const problems = [
  { id: "today", releaseDate: "2026-06-14" },
  { id: "past-2", releaseDate: "2026-06-13" },
  { id: "past-1", releaseDate: "2026-06-12" },
] as PublicProblem[];

describe("buildPastProblemEntries", () => {
  it("excludes today's problem and attaches the latest session", () => {
    const sessions = [
      { id: "new", problemId: "past-2", status: "solved" },
      { id: "old", problemId: "past-2", status: "given_up" },
    ] as GameSession[];

    const entries = buildPastProblemEntries(problems, "today", sessions);
    expect(entries.map((entry) => entry.problem.id)).toEqual([
      "past-2",
      "past-1",
    ]);
    expect(entries[0].latestSession?.id).toBe("new");
    expect(entries[1].latestSession).toBeUndefined();
  });
});
