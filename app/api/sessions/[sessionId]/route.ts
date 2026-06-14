import { NextRequest, NextResponse } from "next/server";
import { handleApiRequest } from "@/lib/api";
import { resolveRequestIdentity } from "@/lib/auth";
import { getOwnedSession } from "@/lib/game-service";
import { deviceIdSchema } from "@/lib/schemas";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  return handleApiRequest(request, "/api/sessions/[sessionId]", async () => {
    const { sessionId } = await params;
    const deviceId = deviceIdSchema.parse(request.nextUrl.searchParams.get("deviceId"));
    const identity = await resolveRequestIdentity(request, deviceId);
    return NextResponse.json(await getOwnedSession(sessionId, identity));
  });
}
