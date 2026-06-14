import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import type { AiAnswer, ChatMessage } from "@/lib/types";

const chatOutput = z.object({
  answer: z.enum(["yes", "no", "irrelevant"]),
});

const validationOutput = z.object({
  isCorrect: z.boolean(),
  confidence: z.number().min(0).max(1),
  feedback: z.string().min(1).max(180),
});

export function buildGameMasterPrompt(input: {
  question: string;
  answer: string;
  history: ChatMessage[];
}) {
  const history = input.history
    .map((message) => `${message.role === "user" ? "플레이어" : "게임 마스터"}: ${message.content}`)
    .join("\n");

  return [
    "당신은 한국어 추리 게임 '바다거북 스프'의 엄격한 게임 마스터입니다.",
    "플레이어의 질문을 숨겨진 정답과 비교해 yes, no, irrelevant 중 하나로만 분류하세요.",
    "yes는 질문의 핵심 전제가 참일 때, no는 거짓일 때, irrelevant는 정답과 무관하거나 예/아니오로 판정할 수 없을 때입니다.",
    "힌트, 설명, 정답의 일부, 추론 과정은 절대 제공하지 마세요.",
    `공개 상황: ${input.question}`,
    `숨겨진 정답: ${input.answer}`,
    history ? `이전 대화:\n${history}` : "이전 대화: 없음",
  ].join("\n\n");
}

export function normalizeAiAnswer(answer: AiAnswer): AiAnswer {
  return answer;
}

function client() {
  return new OpenAI({ apiKey: getServerEnv().OPENAI_API_KEY });
}

export async function classifyQuestion(input: {
  question: string;
  answer: string;
  history: ChatMessage[];
  userMessage: string;
}): Promise<AiAnswer> {
  const env = getServerEnv();
  const response = await client().responses.parse({
    model: env.OPENAI_MODEL,
    instructions: buildGameMasterPrompt(input),
    input: input.userMessage,
    text: { format: zodTextFormat(chatOutput, "turtle_soup_answer") },
    max_output_tokens: 80,
  });

  if (!response.output_parsed) throw new Error("OpenAI returned no parsed chat output");
  return normalizeAiAnswer(response.output_parsed.answer);
}

export async function validatePlayerAnswer(input: {
  question: string;
  actualAnswer: string;
  keywords: string[];
  userAnswer: string;
}) {
  const env = getServerEnv();
  const response = await client().responses.parse({
    model: env.OPENAI_MODEL,
    instructions: [
      "당신은 한국어 추리 게임의 정답 채점자입니다.",
      "표현이나 사소한 세부사항보다 핵심 원인과 논리적 메커니즘의 일치를 평가하세요.",
      "핵심이 맞으면 간결하게 축하하고, 틀리면 정답을 누설하지 않은 채 다시 생각하도록 안내하세요.",
      `문제: ${input.question}`,
      `실제 정답: ${input.actualAnswer}`,
      `핵심 키워드: ${input.keywords.join(", ")}`,
    ].join("\n\n"),
    input: input.userAnswer,
    text: { format: zodTextFormat(validationOutput, "answer_validation") },
    max_output_tokens: 160,
  });

  if (!response.output_parsed) throw new Error("OpenAI returned no parsed validation output");
  return response.output_parsed;
}
