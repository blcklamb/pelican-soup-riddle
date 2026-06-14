import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { assertInProgress, getOwnedSession } from "@/lib/game-service";
import { sessionActionSchema } from "@/lib/schemas";
import { createServiceClient } from "@/lib/supabase";

const EXTENSION_MINUTES = 20;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const { deviceId } = sessionActionSchema.parse(await request.json());
    const session = await getOwnedSession(sessionId, deviceId);
    assertInProgress(session);

    const expiresAt = new Date(
      Date.now() + EXTENSION_MINUTES * 60 * 1000,
    ).toISOString();
    const { error } = await createServiceClient()
      .from("game_sessions")
      .update({ expires_at: expiresAt })
      .eq("id", sessionId)
      .eq("device_id", deviceId)
      .eq("status", "in_progress");
    if (error) throw error;

    return NextResponse.json(await getOwnedSession(sessionId, deviceId));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
