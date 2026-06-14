import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { assertInProgress, getOwnedSession } from "@/lib/game-service";
import { classifyQuestion } from "@/lib/openai";
import { chatSchema } from "@/lib/schemas";
import { createServiceClient } from "@/lib/supabase";
import { AI_ANSWER_LABELS } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const input = chatSchema.parse(await request.json());
    const session = await getOwnedSession(input.sessionId, input.deviceId);
    assertInProgress(session);

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
    const { error } = await createServiceClient()
      .from("game_sessions")
      .update({ conversation_history: history, question_count: session.questionCount + 1 })
      .eq("id", session.id)
      .eq("device_id", input.deviceId)
      .eq("status", "in_progress");
    if (error) throw error;
    return NextResponse.json({ userMessage, assistantMessage, questionCount: session.questionCount + 1 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
