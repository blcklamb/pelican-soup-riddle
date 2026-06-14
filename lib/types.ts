export const GAME_STATUSES = ["in_progress", "solved", "given_up"] as const;
export type GameStatus = (typeof GAME_STATUSES)[number];

export const AI_ANSWERS = [
  "yes",
  "no",
  "irrelevant",
  "invalid_question",
] as const;
export type AiAnswer = (typeof AI_ANSWERS)[number];

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  answerType?: AiAnswer;
  pending?: boolean;
}

export interface PublicProblem {
  id: string;
  title: string;
  question: string;
  category: string;
  difficulty: string;
  releaseDate: string;
}

export interface Solution {
  answer: string;
  explanation: string;
}

export interface GameSession {
  id: string;
  deviceId: string;
  problemId: string;
  status: GameStatus;
  conversationHistory: ChatMessage[];
  questionCount: number;
  startedAt: string;
  expiresAt: string;
  completedAt: string | null;
  createdAt: string;
  problem: PublicProblem;
  solution?: Solution;
}

export interface AnswerResult {
  isCorrect: boolean;
  confidence: number;
  feedback: string;
  session?: GameSession;
}
