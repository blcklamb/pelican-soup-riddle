import type { AiAnswer, GameStatus } from "@/lib/types";

export const AI_ANSWER_LABELS: Record<AiAnswer, string> = {
  yes: "예",
  no: "아니오",
  irrelevant: "관련 없음",
  invalid_question:
    "질문은 [예/아니오/관련 없음]으로 대답할 수 있는 것만 가능합니다",
};

export function shouldCountQuestion(answer: AiAnswer) {
  return answer !== "invalid_question";
}

export const STATUS_LABELS: Record<GameStatus, string> = {
  in_progress: "진행 중",
  solved: "해결",
  given_up: "포기",
};

export function formatDuration(startedAt: string, completedAt?: string | null) {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const seconds = Math.max(0, Math.floor((end - start) / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}분 ${remainder}초` : `${remainder}초`;
}

export function createMessageId() {
  return crypto.randomUUID();
}
