import { ApiError } from "@/lib/api";

export const MAX_QUESTIONS_PER_SESSION = 30;

export function getRemainingQuestions(questionCount: number) {
  return Math.max(0, MAX_QUESTIONS_PER_SESSION - questionCount);
}

export function hasReachedQuestionLimit(questionCount: number) {
  return questionCount >= MAX_QUESTIONS_PER_SESSION;
}

export function assertQuestionAvailable(questionCount: number) {
  if (hasReachedQuestionLimit(questionCount)) {
    throw new ApiError(
      `질문은 최대 ${MAX_QUESTIONS_PER_SESSION}개까지 가능합니다. 정답을 제출하거나 포기해주세요.`,
      409,
    );
  }
}
