import { NextResponse } from "next/server";
import { ApiError, handleApiRequest } from "@/lib/api";
import { resolveRequestIdentity } from "@/lib/auth";
import { getOwnedSession } from "@/lib/game-service";
import { enforceRateLimit } from "@/lib/rate-limit";
import { problemFeedbackSchema } from "@/lib/schemas";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: Request) {
  return handleApiRequest(request, "/api/feedback", async () => {
    const input = problemFeedbackSchema.parse(await request.json());
    await enforceRateLimit(request, { scope: "feedback", deviceId: input.deviceId, limit: 5, windowSeconds: 60 });
    const identity = await resolveRequestIdentity(request, input.deviceId);
    const session = await getOwnedSession(input.sessionId, identity);
    if (session.status === "in_progress") {
      throw new ApiError("종료된 게임만 평가할 수 있습니다.", 409, "SESSION_IN_PROGRESS");
    }

    const supabase = createServiceClient();
    const { error } = await supabase.from("problem_feedback").upsert({
      problem_id: session.problemId,
      session_id: session.id,
      user_id: identity.userId,
      device_id: identity.deviceId,
      fun_rating: input.funRating,
      difficulty_rating: input.difficultyRating,
      fairness_rating: input.fairnessRating,
      report_reason: input.reportReason ?? null,
      comment: input.comment ?? null,
    }, { onConflict: "session_id" });
    if (error) throw error;

    if (input.reportReason) {
      const reportCount = await supabase.from("problem_feedback").select("id", { count: "exact", head: true }).eq("problem_id", session.problemId).not("report_reason", "is", null);
      if (reportCount.error) throw reportCount.error;
      if ((reportCount.count ?? 0) >= 3) {
        const moderation = await supabase.from("problems").update({ moderation_status: "review" }).eq("id", session.problemId).eq("moderation_status", "active");
        if (moderation.error) throw moderation.error;
      }
    }
    return NextResponse.json({ success: true });
  });
}
