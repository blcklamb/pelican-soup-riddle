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
  return {
    total: sessions.length,
    solved: solved.length,
    givenUp: sessions.filter((session) => session.status === "given_up").length,
    averageQuestions: solved.length
      ? Math.round((totalQuestions / solved.length) * 10) / 10
      : 0,
  };
}
