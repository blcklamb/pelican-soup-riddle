import { NextResponse } from "next/server";
import { ApiError, handleApiRequest } from "@/lib/api";
import { resolveRequestIdentity } from "@/lib/auth";
import { assertInProgress, getOwnedSession } from "@/lib/game-service";
import { sessionActionSchema } from "@/lib/schemas";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase";

const EXTENSION_MINUTES = 20;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  return handleApiRequest(request, "/api/sessions/[sessionId]/extend", async () => {
    const { sessionId } = await params;
    const { deviceId } = sessionActionSchema.parse(await request.json());
    await enforceRateLimit(request, {
      scope: "session-extension",
      deviceId,
      limit: 3,
      windowSeconds: 300,
    });
    const identity = await resolveRequestIdentity(request, deviceId);
    const session = await getOwnedSession(sessionId, identity);
    assertInProgress(session);
    if (session.extensionCount >= 1) {
      throw new ApiError("세션 연장은 한 번만 가능합니다.", 409, "EXTENSION_LIMIT_REACHED");
    }

    const expiresAt = new Date(
      Date.now() + EXTENSION_MINUTES * 60 * 1000,
    ).toISOString();
    let updateQuery = createServiceClient()
      .from("game_sessions")
      .update({ expires_at: expiresAt, extension_count: 1 })
      .eq("id", sessionId)
      .eq("status", "in_progress")
      .eq("extension_count", 0);
    updateQuery = identity.userId
      ? updateQuery.or(`user_id.eq.${identity.userId},device_id.eq.${identity.deviceId}`)
      : updateQuery.eq("device_id", identity.deviceId);
    const update = await updateQuery
      .select("id")
      .maybeSingle();
    if (update.error) throw update.error;
    if (!update.data) {
      throw new ApiError("다른 연장 또는 종료 요청이 먼저 처리되었습니다.", 409, "SESSION_CONFLICT");
    }

    return NextResponse.json(await getOwnedSession(sessionId, identity));
  });
}
