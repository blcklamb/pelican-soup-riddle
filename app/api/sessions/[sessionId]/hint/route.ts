import { NextResponse } from "next/server";
import { ApiError, handleApiRequest } from "@/lib/api";
import { resolveRequestIdentity } from "@/lib/auth";
import { assertSessionActive, getOwnedSession } from "@/lib/game-service";
import { getAvailableHintLevel } from "@/lib/hints";
import { enforceRateLimit } from "@/lib/rate-limit";
import { sessionActionSchema } from "@/lib/schemas";
import { createServiceClient } from "@/lib/supabase";
import type { ChatMessage } from "@/lib/types";

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  return handleApiRequest(request, "/api/sessions/[sessionId]/hint", async () => {
    const { sessionId } = await params;
    const { deviceId } = sessionActionSchema.parse(await request.json());
    await enforceRateLimit(request, { scope: "session-hint", deviceId, limit: 4, windowSeconds: 60 });
    const identity = await resolveRequestIdentity(request, deviceId);
    const session = await getOwnedSession(sessionId, identity);
    assertSessionActive(session);
    const level = getAvailableHintLevel(session.questionCount, session.hintCount);
    if (!level) {
      throw new ApiError("아직 사용할 수 있는 힌트가 없습니다.", 409, "HINT_NOT_AVAILABLE");
    }

    const supabase = createServiceClient();
    const problem = await supabase.from("problems").select("hint_1, hint_2").eq("id", session.problemId).single();
    if (problem.error) throw problem.error;
    const hint = level === 1 ? problem.data.hint_1 : problem.data.hint_2;
    if (!hint) throw new ApiError("이 문제에는 준비된 힌트가 없습니다.", 404, "HINT_NOT_FOUND");
    const message: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: `힌트 ${level}: ${hint}`, createdAt: new Date().toISOString() };

    let updateQuery = supabase.from("game_sessions").update({ hint_count: level, conversation_history: [...session.conversationHistory, message] }).eq("id", session.id).eq("status", "in_progress").eq("hint_count", session.hintCount);
    updateQuery = identity.userId ? updateQuery.or(`user_id.eq.${identity.userId},device_id.eq.${identity.deviceId}`) : updateQuery.eq("device_id", identity.deviceId);
    const update = await updateQuery.select("id").maybeSingle();
    if (update.error) throw update.error;
    if (!update.data) throw new ApiError("다른 요청이 먼저 처리되었습니다.", 409, "SESSION_CONFLICT");
    return NextResponse.json(await getOwnedSession(session.id, identity));
  });
}
