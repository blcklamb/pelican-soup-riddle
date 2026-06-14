import { describe, expect, it } from "vitest";
import { assertInProgress } from "@/lib/game-service";
import type { GameSession } from "@/lib/types";

const session = { status: "in_progress" } as GameSession;

describe("session state transition guard", () => {
  it("allows an active session", () => {
    expect(() => assertInProgress(session)).not.toThrow();
  });

  it.each(["solved", "given_up"] as const)("rejects %s sessions", (status) => {
    expect(() => assertInProgress({ ...session, status })).toThrow("이미 종료된 게임입니다.");
  });
});
