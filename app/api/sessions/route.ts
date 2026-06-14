import { NextRequest, NextResponse } from "next/server";
import { ApiError, handleApiRequest } from "@/lib/api";
import { resolveRequestIdentity } from "@/lib/auth";
import { mapSession } from "@/lib/mappers";
import { createSessionSchema, deviceIdSchema } from "@/lib/schemas";
import { countActiveSessions, getQueueStatus, sessionSelect } from "@/lib/game-service";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: Request) {
  return handleApiRequest(request, "/api/sessions", async () => {
    const input = createSessionSchema.parse(await request.json());
    await enforceRateLimit(request, {
      scope: "sessions",
      deviceId: input.deviceId,
      limit: 10,
      windowSeconds: 60,
    });
    const identity = await resolveRequestIdentity(request, input.deviceId);
    const supabase = createServiceClient();
    let existingQuery = supabase
      .from("game_sessions")
      .select(sessionSelect)
      .eq("problem_id", input.problemId)
      .eq("status", "in_progress")
      .order("created_at", { ascending: false })
      .limit(1);
    existingQuery = identity.userId
      ? existingQuery.or(`user_id.eq.${identity.userId},device_id.eq.${identity.deviceId}`)
      : existingQuery.eq("device_id", identity.deviceId);
    const existing = await existingQuery
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) {
      return NextResponse.json(mapSession(existing.data as unknown as Record<string, unknown>));
    }

    const queue = getQueueStatus(await countActiveSessions());
    if (!queue.canEnter) {
      throw new ApiError(
        "현재 접속자가 많아 잠시 대기해주세요.",
        503,
        "WAITING_QUEUE",
        {
          position: queue.position,
          estimatedWaitSeconds: queue.estimatedWaitSeconds,
        },
      );
    }

    const created = await supabase
      .from("game_sessions")
      .insert({ device_id: input.deviceId, user_id: identity.userId, problem_id: input.problemId })
      .select(sessionSelect)
      .single();
    if (created.error) throw created.error;
    return NextResponse.json(mapSession(created.data as unknown as Record<string, unknown>), { status: 201 });
  });
}

export async function GET(request: NextRequest) {
  return handleApiRequest(request, "/api/sessions", async () => {
    const deviceId = deviceIdSchema.parse(request.nextUrl.searchParams.get("deviceId"));
    const identity = await resolveRequestIdentity(request, deviceId);
    let query = createServiceClient()
      .from("game_sessions")
      .select(sessionSelect)
      .order("created_at", { ascending: false });
    query = identity.userId
      ? query.or(`user_id.eq.${identity.userId},device_id.eq.${identity.deviceId}`)
      : query.eq("device_id", identity.deviceId);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json((data ?? []).map((row) => mapSession(row as unknown as Record<string, unknown>, true)));
  });
}
