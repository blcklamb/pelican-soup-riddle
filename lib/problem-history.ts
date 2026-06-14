import type { GameSession, PublicProblem } from "@/lib/types";

export interface PastProblemEntry {
  problem: PublicProblem;
  latestSession?: GameSession;
}

export function buildPastProblemEntries(
  problems: PublicProblem[],
  dailyProblemId: string,
  sessions: GameSession[],
): PastProblemEntry[] {
  const latestSessionByProblem = new Map<string, GameSession>();

  for (const session of sessions) {
    if (!latestSessionByProblem.has(session.problemId)) {
      latestSessionByProblem.set(session.problemId, session);
    }
  }

  return problems
    .filter((problem) => problem.id !== dailyProblemId)
    .map((problem) => ({
      problem,
      latestSession: latestSessionByProblem.get(problem.id),
    }));
}
