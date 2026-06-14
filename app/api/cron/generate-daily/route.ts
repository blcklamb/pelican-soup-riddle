import { NextResponse } from "next/server";
import { handleApiRequest } from "@/lib/api";
import { assertCronAuthorized } from "@/lib/cron";
import { ensureDailyProblem } from "@/lib/daily-problem-generation";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleApiRequest(request, "/api/cron/generate-daily", async () => {
    assertCronAuthorized(request);
    const result = await ensureDailyProblem();
    return NextResponse.json({ success: true, ...result });
  });
}
