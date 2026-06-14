import { describe, expect, it, vi } from "vitest";
import { apiErrorResponse } from "@/lib/api";

describe("apiErrorResponse", () => {
  it.each([
    [{ status: 429 }, 429, "요청이 많습니다"],
    [{ status: 408 }, 504, "응답이 지연"],
    [{ status: 500 }, 503, "일시적으로 불안정"],
  ] as const)("maps external errors", async (error, status, message) => {
    const response = apiErrorResponse(error);
    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining(message),
    });
  });

  it("does not expose invalid API key details", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = apiErrorResponse({
      status: 401,
      message: "secret key is invalid",
    });
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "AI 서비스 설정을 확인할 수 없습니다.",
    });
  });
});
