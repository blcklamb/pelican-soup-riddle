import type { ChatMessage, GameSession, PublicProblem, Solution } from "@/lib/types";
import { getAvailableHintLevel } from "@/lib/hints";

type Row = Record<string, unknown>;

function nestedRow(value: unknown): Row {
  if (Array.isArray(value)) return (value[0] ?? {}) as Row;
  return (value ?? {}) as Row;
}

export function mapPublicProblem(row: Row, releaseDate?: string): PublicProblem {
  return {
    id: String(row.id),
    title: String(row.title),
    question: String(row.question),
    category: String(row.category),
    difficulty: String(row.difficulty),
    releaseDate: releaseDate ?? String(row.release_date ?? row.created_at ?? ""),
  };
}

export function mapSession(row: Row, includeSolution = false): GameSession {
  const problem = nestedRow(row.problem);
  const session: GameSession = {
    id: String(row.id),
    deviceId: String(row.device_id),
    userId: row.user_id ? String(row.user_id) : null,
    problemId: String(row.problem_id),
    status: row.status as GameSession["status"],
    conversationHistory: (row.conversation_history ?? []) as ChatMessage[],
    questionCount: Number(row.question_count ?? 0),
    extensionCount: Number(row.extension_count ?? 0),
    hintCount: Number(row.hint_count ?? 0),
    availableHintLevel: getAvailableHintLevel(
      Number(row.question_count ?? 0),
      Number(row.hint_count ?? 0),
      Boolean(problem.hint_1),
      Boolean(problem.hint_2),
    ),
    startedAt: String(row.started_at),
    expiresAt: String(row.expires_at),
    completedAt: row.completed_at ? String(row.completed_at) : null,
    createdAt: String(row.created_at),
    problem: mapPublicProblem(problem),
  };

  if (includeSolution && row.status !== "in_progress") {
    session.solution = {
      answer: String(problem.answer),
      explanation: String(problem.explanation),
    } satisfies Solution;
  }
  return session;
}
