import { NextResponse } from "next/server";
import { ApiError, handleApiRequest } from "@/lib/api";
import { resolveRequestIdentity } from "@/lib/auth";
import { assertSessionActive, getOwnedSession } from "@/lib/game-service";
import { assertQuestionAvailable } from "@/lib/game-policy";
import { classifyQuestion } from "@/lib/openai";
import { enforceRateLimit } from "@/lib/rate-limit";
import { chatSchema } from "@/lib/schemas";
import { createServiceClient } from "@/lib/supabase";
import { AI_ANSWER_LABELS, shouldCountQuestion } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

export async function POST(request: Request) {
  return handleApiRequest(request, "/api/chat", async () => {
    const input = chatSchema.parse(await request.json());
    await enforceRateLimit(request, {
      scope: "chat",
      deviceId: input.deviceId,
      limit: 20,
      windowSeconds: 60,
    });
    const identity = await resolveRequestIdentity(request, input.deviceId);
    const session = await getOwnedSession(input.sessionId, identity);
    assertSessionActive(session);
    assertQuestionAvailable(session.questionCount);

    const problemResult = await createServiceClient()
      .from("problems")
      .select("answer")
      .eq("id", session.problemId)
      .single();
    if (problemResult.error) throw problemResult.error;

    const answerType = await classifyQuestion({
      question: session.problem.question,
      answer: problemResult.data.answer,
      history: session.conversationHistory,
      userMessage: input.message,
    });
    const now = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.message,
      createdAt: now,
    };
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: AI_ANSWER_LABELS[answerType],
      answerType,
      createdAt: now,
    };
    const history = [...session.conversationHistory, userMessage, assistantMessage];
    const questionCount = shouldCountQuestion(answerType)
      ? session.questionCount + 1
      : session.questionCount;
    let updateQuery = createServiceClient()
      .from("game_sessions")
      .update({ conversation_history: history, question_count: questionCount })
      .eq("id", session.id)
      .eq("status", "in_progress")
      .eq("question_count", session.questionCount);
    updateQuery = identity.userId
      ? updateQuery.or(`user_id.eq.${identity.userId},device_id.eq.${identity.deviceId}`)
      : updateQuery.eq("device_id", identity.deviceId);
    const update = await updateQuery
      .select("id")
      .maybeSingle();
    if (update.error) throw update.error;
    if (!update.data) {
      throw new ApiError(
        "다른 질문이 먼저 처리되었습니다. 질문 수를 확인하고 다시 시도해주세요.",
        409,
      );
    }
    return NextResponse.json({ userMessage, assistantMessage, questionCount });
  });
}
