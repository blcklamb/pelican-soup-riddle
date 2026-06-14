import { describe, expect, it } from "vitest";
import { getArchiveStats, groupSessionsByDate } from "@/lib/archive";
import type { GameSession } from "@/lib/types";

function session(
  id: string,
  createdAt: string,
  status: GameSession["status"],
  questionCount: number,
) {
  return { id, createdAt, status, questionCount, problem: { category: "Logic" } } as GameSession;
}

describe("archive summaries", () => {
  const sessions = [
    session("a", "2026-06-14T15:30:00.000Z", "solved", 4),
    session("b", "2026-06-14T01:00:00.000Z", "solved", 7),
    session("c", "2026-06-13T01:00:00.000Z", "given_up", 10),
  ];

  it("groups sessions by Korean calendar date", () => {
    const groups = groupSessionsByDate(sessions);
    expect(groups.map((group) => group.date)).toEqual([
      "2026-06-15",
      "2026-06-14",
      "2026-06-13",
    ]);
  });

  it("calculates solved and question statistics", () => {
    expect(getArchiveStats(sessions)).toEqual({
      total: 3,
      solved: 2,
      givenUp: 1,
      averageQuestions: 5.5,
      solveRate: 67,
      maxStreak: 3,
      categoryStats: [{ category: "Logic", played: 3, solved: 2 }],
    });
  });
});
