import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { assertInProgress, getOwnedSession } from "@/lib/game-service";
import { validatePlayerAnswer } from "@/lib/openai";
import { answerSchema } from "@/lib/schemas";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const input = answerSchema.parse(await request.json());
    const session = await getOwnedSession(input.sessionId, input.deviceId);
    assertInProgress(session);
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

    const { error } = await supabase
      .from("game_sessions")
      .update({ status: "solved", completed_at: new Date().toISOString() })
      .eq("id", session.id)
      .eq("device_id", input.deviceId)
      .eq("status", "in_progress");
    if (error) throw error;
    return NextResponse.json({ ...verdict, isCorrect: true, session: await getOwnedSession(session.id, input.deviceId) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
