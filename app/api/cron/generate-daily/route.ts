import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { assertCronAuthorized } from "@/lib/cron";
import { ensureDailyProblem } from "@/lib/daily-problem-generation";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    assertCronAuthorized(request);
    const result = await ensureDailyProblem();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
