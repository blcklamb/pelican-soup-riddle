import { describe, expect, it } from "vitest";
import { answerSchema, chatSchema } from "@/lib/schemas";

const deviceId = "20000000-0000-4000-8000-000000000001";
const sessionId = "30000000-0000-4000-8000-000000000001";

describe("API input schemas", () => {
  it("rejects an empty question", () => {
    expect(chatSchema.safeParse({ deviceId, sessionId, message: "  " }).success).toBe(false);
  });

  it("rejects questions over 300 characters", () => {
    expect(chatSchema.safeParse({ deviceId, sessionId, message: "가".repeat(301) }).success).toBe(false);
  });

  it("accepts a valid answer", () => {
    expect(answerSchema.safeParse({ deviceId, sessionId, answer: "얼음이 녹았다" }).success).toBe(true);
  });

  it("rejects a malformed device id", () => {
    expect(chatSchema.safeParse({ deviceId: "not-a-uuid", sessionId, message: "밤인가요?" }).success).toBe(false);
  });
});
