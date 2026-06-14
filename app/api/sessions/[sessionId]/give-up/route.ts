import { NextResponse } from "next/server";
import { ApiError, handleApiRequest } from "@/lib/api";
import { resolveRequestIdentity } from "@/lib/auth";
import { assertInProgress, getOwnedSession } from "@/lib/game-service";
import { sessionActionSchema } from "@/lib/schemas";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  return handleApiRequest(request, "/api/sessions/[sessionId]/give-up", async () => {
    const { sessionId } = await params;
    const { deviceId } = sessionActionSchema.parse(await request.json());
    await enforceRateLimit(request, {
      scope: "session-give-up",
      deviceId,
      limit: 5,
      windowSeconds: 60,
    });
    const identity = await resolveRequestIdentity(request, deviceId);
    const session = await getOwnedSession(sessionId, identity);
    assertInProgress(session);
    let updateQuery = createServiceClient()
      .from("game_sessions")
      .update({ status: "given_up", completed_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("status", "in_progress");
    updateQuery = identity.userId
      ? updateQuery.or(`user_id.eq.${identity.userId},device_id.eq.${identity.deviceId}`)
      : updateQuery.eq("device_id", identity.deviceId);
    const update = await updateQuery
      .select("id")
      .maybeSingle();
    if (update.error) throw update.error;
    if (!update.data) {
      throw new ApiError("다른 종료 요청이 먼저 처리되었습니다.", 409, "SESSION_CONFLICT");
    }
    return NextResponse.json(await getOwnedSession(sessionId, identity));
  });
}
