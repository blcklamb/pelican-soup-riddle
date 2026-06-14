import { z } from "zod";

export const deviceIdSchema = z.string().uuid("올바르지 않은 기기 식별자입니다.");

export const createSessionSchema = z.object({
  deviceId: deviceIdSchema,
  problemId: z.string().uuid(),
});

export const chatSchema = z.object({
  deviceId: deviceIdSchema,
  sessionId: z.string().uuid(),
  message: z.string().trim().min(1).max(300),
});

export const answerSchema = z.object({
  deviceId: deviceIdSchema,
  sessionId: z.string().uuid(),
  answer: z.string().trim().min(1).max(1000),
});

export const sessionActionSchema = z.object({ deviceId: deviceIdSchema });

export const problemFeedbackSchema = z.object({
  deviceId: deviceIdSchema,
  sessionId: z.string().uuid(),
  funRating: z.number().int().min(1).max(5),
  difficultyRating: z.number().int().min(1).max(5),
  fairnessRating: z.number().int().min(1).max(5),
  reportReason: z.enum(["incorrect_answer", "ambiguous", "offensive", "copyright"]).optional(),
  comment: z.string().trim().max(500).optional(),
});
