import { ApiError } from "@/lib/api";
import { mapSession } from "@/lib/mappers";
import { createServiceClient } from "@/lib/supabase";
import type { GameSession } from "@/lib/types";

const sessionSelect = `
  id, device_id, problem_id, status, conversation_history, question_count,
  started_at, completed_at, created_at,
  problem:problems(id, title, question, category, difficulty, created_at, answer, explanation)
`;

export async function getOwnedSession(
  sessionId: string,
  deviceId: string,
): Promise<GameSession> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("game_sessions")
    .select(sessionSelect)
    .eq("id", sessionId)
    .eq("device_id", deviceId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new ApiError("게임 기록을 찾을 수 없습니다.", 404);
  return mapSession(data as unknown as Record<string, unknown>, true);
}

export function assertInProgress(session: GameSession) {
  if (session.status !== "in_progress") {
    throw new ApiError("이미 종료된 게임입니다.", 409);
  }
}

export { sessionSelect };
