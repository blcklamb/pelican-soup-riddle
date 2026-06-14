import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import type { AiAnswer, ChatMessage } from "@/lib/types";

const chatOutput = z.object({
  answer: z.enum(["yes", "no", "irrelevant", "invalid_question"]),
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
    "플레이어의 입력을 invalid_question, yes, no, irrelevant 중 하나로만 분류하세요.",
    "가장 먼저 입력이 하나의 사실을 예/아니오로 확인하는 폐쇄형 질문인지 판정하세요.",
    "정답, 원인, 인물, 장소, 물건의 정체를 직접 말해 달라는 개방형 질문은 항상 invalid_question입니다.",
    "'왜 그랬나요?', '무슨 일이 있었나요?', '어떤 문인가요?', '정답이 뭔가요?', '범인은 누구인가요?'처럼 설명이나 명사를 요구하는 질문도 invalid_question입니다.",
    "'그 문은 실제 출입문인가요?', '누군가 다쳤나요?'처럼 하나의 전제를 예/아니오로 확인할 수 있으면 invalid_question이 아닙니다.",
    "yes는 질문의 핵심 전제가 숨겨진 정답에서 참일 때입니다.",
    "no는 질문의 핵심 전제가 숨겨진 정답에서 거짓일 때입니다.",
    "irrelevant는 형식은 올바른 예/아니오 질문이지만 정답의 인과관계와 무관할 때입니다.",
    "개방형 질문을 irrelevant로 분류하지 마세요. 개방형 질문은 반드시 invalid_question입니다.",
    "힌트, 설명, 정답의 일부, 추론 과정은 절대 제공하지 마세요.",
    `공개 상황: ${input.question}`,
    `숨겨진 정답: ${input.answer}`,
    history ? `이전 대화:\n${history}` : "이전 대화: 없음",
  ].join("\n\n");
}

export function buildProblemGenerationPrompt(existingTitles: string[] = []) {
  return [
    "당신은 한국어 바다거북 스프 문제를 설계하고 검수하는 작가입니다.",
    "처음에는 의문스럽지만 정답을 알면 모든 단서가 자연스럽게 설명되는 문제만 생성하세요.",
    "정답은 현실에서 실제로 일어날 수 있는 2~4단계의 명확한 인과관계를 가져야 합니다.",
    "문제 본문에 제시된 행동과 결과가 정답에서 빠짐없이 설명되어야 합니다.",
    "플레이어가 예/아니오 질문 5~15개로 핵심 원인에 접근할 수 있어야 합니다.",
    "다음 방식으로만 반전을 만드는 문제는 금지합니다: 꿈, 연극, 영화, 게임, 가상 화면, 말장난, 동음이의어, 사실은 사람이 아니었다는 재정의.",
    "본문에 근거가 전혀 없는 특수 직업, 희귀 질환, 비밀 약속, 우연한 소품, 임의의 규칙을 정답에 갑자기 추가하지 마세요.",
    "정답을 안 뒤에도 '그럴 수도 있다' 수준인 해석은 폐기하고, 등장인물의 행동이 현실적으로 가장 납득되는지 검수하세요.",
    "생성 후 다음 질문에 하나라도 아니오라면 다시 작성하세요: 모든 단서가 필요한가, 인과관계가 필연적인가, 핵심 반전에 공정한 단서가 있는가, 억지 설정 없이 설명되는가.",
    existingTitles.length
      ? `다음 기존 문제와 소재 및 반전을 중복하지 마세요: ${existingTitles.join(", ")}`
      : "기존의 유명 문제를 문장만 바꾸어 복제하지 마세요.",
    "출력 필드: title, question, answer, explanation, answerKeywords, category, difficulty.",
  ].join("\n\n");
}

export function buildAnswerValidationPrompt(input: {
  question: string;
  actualAnswer: string;
  keywords: string[];
}) {
  return [
    "당신은 한국어 추리 게임 '바다거북 스프'의 관대한 정답 채점자입니다.",
    "문장 표현이나 세부 설정의 정확한 복제가 아니라, 사건을 설명하는 핵심 원인과 인과관계가 실제 정답과 같은지 평가하세요.",
    "플레이어가 실제 정답에 없는 인물의 감정, 장소, 시간, 도구, 행동 과정 등의 세부사항을 상상해 덧붙였더라도 핵심 맥락과 양립하고 사건의 원인과 결과를 같은 방식으로 설명한다면 정답으로 판정하세요.",
    "추가된 세부사항이 실제 정답에 명시되지 않았다는 이유만으로 오답 처리하지 마세요. 실제 정답과 직접 모순되거나 핵심 메커니즘을 다른 원인으로 바꾸는 경우에만 그 세부사항을 감점하세요.",
    "핵심 등장인물이나 사물의 명칭이 달라도 역할과 기능이 같으면 같은 개념으로 인정하세요.",
    "핵심 키워드는 의미 비교를 돕는 참고 자료이며, 모든 단어를 그대로 포함해야 하는 체크리스트가 아닙니다. 동의어, 의역, 상위·하위 개념도 문맥상 같은 의미라면 인정하세요.",
    "다음 조건을 모두 만족하면 isCorrect를 true로 판정하세요: 핵심 반전 또는 원인을 짚었고, 문제의 주요 행동과 결과를 설명하며, 실제 정답의 핵심 사실과 모순되지 않는다.",
    "핵심 원인을 빠뜨린 추측, 결과만 반복한 답, 실제 정답과 모순되는 설명, 우연히 키워드만 나열한 답은 오답입니다.",
    "정답 맥락이 실질적으로 일치하면 사소한 불확실성이 있어도 confidence를 0.7 이상으로 설정하세요.",
    "정답이면 추가 상상까지 지적하지 말고 간결하게 축하하세요. 오답이면 실제 정답이나 새로운 핵심 단서를 누설하지 않은 채 다시 생각하도록 안내하세요.",
    `문제: ${input.question}`,
    `실제 정답: ${input.actualAnswer}`,
    `핵심 키워드: ${input.keywords.length ? input.keywords.join(", ") : "없음"}`,
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
    instructions: buildAnswerValidationPrompt(input),
    input: input.userAnswer,
    text: { format: zodTextFormat(validationOutput, "answer_validation") },
    max_output_tokens: 160,
  });

  if (!response.output_parsed) throw new Error("OpenAI returned no parsed validation output");
  return response.output_parsed;
}
