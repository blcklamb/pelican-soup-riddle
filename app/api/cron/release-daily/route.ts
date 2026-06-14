import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { assertCronAuthorized } from "@/lib/cron";
import { releaseDailyProblem } from "@/lib/daily-problem-generation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    assertCronAuthorized(request);
    return NextResponse.json({
      success: true,
      ...(await releaseDailyProblem()),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
