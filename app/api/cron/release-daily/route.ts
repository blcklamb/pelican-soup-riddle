import { NextResponse } from "next/server";
import { handleApiRequest } from "@/lib/api";
import { assertCronAuthorized } from "@/lib/cron";
import { releaseDailyProblem } from "@/lib/daily-problem-generation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleApiRequest(request, "/api/cron/release-daily", async () => {
    assertCronAuthorized(request);
    return NextResponse.json({
      success: true,
      ...(await releaseDailyProblem()),
    });
  });
}
