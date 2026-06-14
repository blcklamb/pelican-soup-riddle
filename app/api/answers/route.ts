import { NextResponse } from "next/server";
import { ApiError, handleApiRequest } from "@/lib/api";
import { resolveRequestIdentity } from "@/lib/auth";
import { assertSessionActive, getOwnedSession } from "@/lib/game-service";
import { validatePlayerAnswer } from "@/lib/openai";
import { enforceRateLimit } from "@/lib/rate-limit";
import { answerSchema } from "@/lib/schemas";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: Request) {
  return handleApiRequest(request, "/api/answers", async () => {
    const input = answerSchema.parse(await request.json());
    await enforceRateLimit(request, {
      scope: "answers",
      deviceId: input.deviceId,
      limit: 8,
      windowSeconds: 60,
    });
    const identity = await resolveRequestIdentity(request, input.deviceId);
    const session = await getOwnedSession(input.sessionId, identity);
    assertSessionActive(session);
    const supabase = createServiceClient();
    const problemResult = await supabase
      .from("problems")
      .select("answer, answer_keywords")
      .eq("id", session.problemId)
      .single();
    if (problemResult.error) throw problemResult.error;

    const verdict = await validatePlayerAnswer({
      question: session.problem.question,
      actualAnswer: problemResult.data.answer,
      keywords: problemResult.data.answer_keywords ?? [],
      userAnswer: input.answer,
    });
    const isCorrect = verdict.isCorrect && verdict.confidence >= 0.7;
    if (!isCorrect) return NextResponse.json({ ...verdict, isCorrect: false });

    let updateQuery = supabase
      .from("game_sessions")
      .update({ status: "solved", completed_at: new Date().toISOString() })
      .eq("id", session.id)
      .eq("status", "in_progress");
    updateQuery = identity.userId
      ? updateQuery.or(`user_id.eq.${identity.userId},device_id.eq.${identity.deviceId}`)
      : updateQuery.eq("device_id", identity.deviceId);
    const update = await updateQuery
      .select("id")
      .maybeSingle();
    if (update.error) throw update.error;
    if (!update.data) {
      throw new ApiError("다른 종료 요청이 먼저 처리되었습니다.", 409, "SESSION_CONFLICT");
    }
    return NextResponse.json({ ...verdict, isCorrect: true, session: await getOwnedSession(session.id, identity) });
  });
}
