import { NextResponse } from "next/server";
import { handleApiRequest } from "@/lib/api";
import { assertCronAuthorized } from "@/lib/cron";
import {
  fillProblemSchedule,
  getWeeklyGenerationStartDate,
  WEEKLY_GENERATION_DAYS,
} from "@/lib/daily-problem-generation";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleApiRequest(request, "/api/cron/generate-weekly", async () => {
    assertCronAuthorized(request);
    const now = new Date();
    const result = await fillProblemSchedule({
      startDate: getWeeklyGenerationStartDate(now),
      days: WEEKLY_GENERATION_DAYS,
      maxGenerate: WEEKLY_GENERATION_DAYS,
      now,
    });
    return NextResponse.json({ success: result.failed === 0, ...result });
  });
}
