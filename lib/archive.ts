import type { GameSession } from "@/lib/types";

export interface ArchiveGroup {
  date: string;
  sessions: GameSession[];
}

export function groupSessionsByDate(sessions: GameSession[]): ArchiveGroup[] {
  const groups = new Map<string, GameSession[]>();
  for (const session of sessions) {
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(session.createdAt));
    groups.set(date, [...(groups.get(date) ?? []), session]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, groupedSessions]) => ({ date, sessions: groupedSessions }));
}

export function getArchiveStats(sessions: GameSession[]) {
  const solved = sessions.filter((session) => session.status === "solved");
  const totalQuestions = solved.reduce(
    (sum, session) => sum + session.questionCount,
    0,
  );
  const playedDates = [...new Set(groupSessionsByDate(sessions).map((group) => group.date))].sort();
  let streak = playedDates.length ? 1 : 0;
  let maxStreak = streak;
  for (let index = 1; index < playedDates.length; index += 1) {
    const previous = new Date(`${playedDates[index - 1]}T00:00:00+09:00`);
    const current = new Date(`${playedDates[index]}T00:00:00+09:00`);
    streak = current.getTime() - previous.getTime() === 86_400_000 ? streak + 1 : 1;
    maxStreak = Math.max(maxStreak, streak);
  }
  const categoryStats = Object.entries(
    sessions.reduce<Record<string, { played: number; solved: number }>>((result, session) => {
      const category = session.problem.category;
      const current = result[category] ?? { played: 0, solved: 0 };
      result[category] = { played: current.played + 1, solved: current.solved + (session.status === "solved" ? 1 : 0) };
      return result;
    }, {}),
  ).map(([category, value]) => ({ category, ...value }));
  return {
    total: sessions.length,
    solved: solved.length,
    givenUp: sessions.filter((session) => session.status === "given_up").length,
    averageQuestions: solved.length
      ? Math.round((totalQuestions / solved.length) * 10) / 10
      : 0,
    solveRate: sessions.length ? Math.round((solved.length / sessions.length) * 100) : 0,
    maxStreak,
    categoryStats,
  };
}
