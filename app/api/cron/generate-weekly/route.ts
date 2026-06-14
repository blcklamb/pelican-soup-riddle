import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { assertCronAuthorized } from "@/lib/cron";
import {
  fillProblemSchedule,
  SCHEDULE_HORIZON_DAYS,
} from "@/lib/daily-problem-generation";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    assertCronAuthorized(request);
    const result = await fillProblemSchedule({
      days: SCHEDULE_HORIZON_DAYS,
      maxGenerate: SCHEDULE_HORIZON_DAYS,
    });
    return NextResponse.json({ success: result.failed === 0, ...result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
