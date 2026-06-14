import { describe, expect, it } from "vitest";
import {
  assertInProgress,
  assertSessionActive,
  getQueueStatus,
  isSessionExpired,
} from "@/lib/game-service";
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

describe("queue status", () => {
  it("allows a new session below the active-session cap", () => {
    expect(getQueueStatus(99)).toEqual({
      canEnter: true,
      position: 0,
      estimatedWaitSeconds: 0,
    });
  });

  it("queues a new session at the active-session cap", () => {
    expect(getQueueStatus(100)).toEqual({
      canEnter: false,
      position: 1,
      estimatedWaitSeconds: 30,
    });
    expect(getQueueStatus(104)).toEqual({
      canEnter: false,
      position: 5,
      estimatedWaitSeconds: 150,
    });
  });
});

describe("session expiration guard", () => {
  const activeSession = {
    status: "in_progress",
    expiresAt: "2026-06-14T00:20:00.000Z",
  } as GameSession;

  it("allows requests before the expiration time", () => {
    expect(() =>
      assertSessionActive(activeSession, Date.parse("2026-06-14T00:19:59.000Z")),
    ).not.toThrow();
    expect(
      isSessionExpired(
        activeSession,
        Date.parse("2026-06-14T00:19:59.000Z"),
      ),
    ).toBe(false);
  });

  it("rejects requests at and after the expiration time", () => {
    expect(() =>
      assertSessionActive(activeSession, Date.parse("2026-06-14T00:20:00.000Z")),
    ).toThrow("세션 시간이 만료되었습니다");
    expect(
      isSessionExpired(
        activeSession,
        Date.parse("2026-06-14T00:20:01.000Z"),
      ),
    ).toBe(true);
  });
});
