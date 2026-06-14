import { ApiError } from "@/lib/api";
import { mapSession } from "@/lib/mappers";
import { createServiceClient } from "@/lib/supabase";
import type { GameSession } from "@/lib/types";
import type { RequestIdentity } from "@/lib/auth";

const sessionSelect = `
  id, device_id, user_id, problem_id, status, conversation_history, question_count, extension_count, hint_count,
  started_at, expires_at, completed_at, created_at,
  problem:problems(id, title, question, category, difficulty, created_at, answer, explanation, hint_1, hint_2)
`;

export const MAX_ACTIVE_SESSIONS = 100;
const ESTIMATED_SECONDS_PER_POSITION = 30;

export function getQueueStatus(activeSessionCount: number) {
  if (activeSessionCount < MAX_ACTIVE_SESSIONS) {
    return {
      canEnter: true,
      position: 0,
      estimatedWaitSeconds: 0,
    };
  }
  const position = Math.max(1, activeSessionCount - MAX_ACTIVE_SESSIONS + 1);
  return {
    canEnter: false,
    position,
    estimatedWaitSeconds: position * ESTIMATED_SECONDS_PER_POSITION,
  };
}

export async function countActiveSessions(now = new Date()) {
  const { count, error } = await createServiceClient()
    .from("game_sessions")
    .select("*", { count: "exact", head: true })
    .eq("status", "in_progress")
    .gt("expires_at", now.toISOString());
  if (error) throw error;
  return count ?? 0;
}

export async function getOwnedSession(
  sessionId: string,
  identity: RequestIdentity,
): Promise<GameSession> {
  const supabase = createServiceClient();
  let query = supabase
    .from("game_sessions")
    .select(sessionSelect)
    .eq("id", sessionId);
  query = identity.userId
    ? query.or(`user_id.eq.${identity.userId},device_id.eq.${identity.deviceId}`)
    : query.eq("device_id", identity.deviceId);
  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  if (!data) throw new ApiError("게임 기록을 찾을 수 없습니다.", 404);
  return mapSession(data as unknown as Record<string, unknown>, true);
}

export function assertInProgress(session: GameSession) {
  if (session.status !== "in_progress") {
    throw new ApiError("이미 종료된 게임입니다.", 409);
  }
}

export function isSessionExpired(session: Pick<GameSession, "expiresAt">, now = Date.now()) {
  return new Date(session.expiresAt).getTime() <= now;
}

export function assertSessionActive(session: GameSession, now = Date.now()) {
  assertInProgress(session);
  if (isSessionExpired(session, now)) {
    throw new ApiError("세션 시간이 만료되었습니다. 연장하거나 포기해주세요.", 409);
  }
}

export { sessionSelect };
