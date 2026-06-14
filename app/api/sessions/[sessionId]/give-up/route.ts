import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { assertInProgress, getOwnedSession } from "@/lib/game-service";
import { sessionActionSchema } from "@/lib/schemas";
import { createServiceClient } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const { deviceId } = sessionActionSchema.parse(await request.json());
    const session = await getOwnedSession(sessionId, deviceId);
    assertInProgress(session);
    const { error } = await createServiceClient()
      .from("game_sessions")
      .update({ status: "given_up", completed_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("device_id", deviceId)
      .eq("status", "in_progress");
    if (error) throw error;
    return NextResponse.json(await getOwnedSession(sessionId, deviceId));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
