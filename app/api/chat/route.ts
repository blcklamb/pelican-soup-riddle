import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api";
import { assertSessionActive, getOwnedSession } from "@/lib/game-service";
import { assertQuestionAvailable } from "@/lib/game-policy";
import { classifyQuestion } from "@/lib/openai";
import { chatSchema } from "@/lib/schemas";
import { createServiceClient } from "@/lib/supabase";
import { AI_ANSWER_LABELS, shouldCountQuestion } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const input = chatSchema.parse(await request.json());
    const session = await getOwnedSession(input.sessionId, input.deviceId);
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
    const update = await createServiceClient()
      .from("game_sessions")
      .update({ conversation_history: history, question_count: questionCount })
      .eq("id", session.id)
      .eq("device_id", input.deviceId)
      .eq("status", "in_progress")
      .eq("question_count", session.questionCount)
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
  } catch (error) {
    return apiErrorResponse(error);
  }
}
