import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { getOwnedSession } from "@/lib/game-service";
import { deviceIdSchema } from "@/lib/schemas";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const deviceId = deviceIdSchema.parse(request.nextUrl.searchParams.get("deviceId"));
    return NextResponse.json(await getOwnedSession(sessionId, deviceId));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
