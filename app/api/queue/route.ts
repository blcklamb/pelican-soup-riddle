import { NextRequest, NextResponse } from "next/server";
import { handleApiRequest } from "@/lib/api";
import { resolveRequestIdentity } from "@/lib/auth";
import {
  countActiveSessions,
  getQueueStatus,
  hasExistingSession,
} from "@/lib/game-service";
import { enforceRateLimit } from "@/lib/rate-limit";
import { deviceIdSchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
  return handleApiRequest(request, "/api/queue", async () => {
    const deviceId = deviceIdSchema.parse(
      request.nextUrl.searchParams.get("deviceId"),
    );
    await enforceRateLimit(request, {
      scope: "queue",
      deviceId,
      limit: 20,
      windowSeconds: 60,
    });
    const identity = await resolveRequestIdentity(request, deviceId);
    if (await hasExistingSession(identity)) {
      return NextResponse.json({
        canEnter: true,
        position: 0,
        estimatedWaitSeconds: 0,
      });
    }

    return NextResponse.json(getQueueStatus(await countActiveSessions()));
  });
}
