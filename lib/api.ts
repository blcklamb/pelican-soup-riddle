import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
    public code = "REQUEST_FAILED",
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

type ErrorBody = {
  error: string;
  code: string;
  requestId?: string;
  details?: Record<string, unknown>;
};

function errorResponse(body: ErrorBody, status: number) {
  return NextResponse.json(body, { status });
}

export function apiErrorResponse(error: unknown, requestId?: string) {
  if (error instanceof ApiError) {
    return errorResponse(
      {
        error: error.message,
        code: error.code,
        requestId,
        details: error.details,
      },
      error.status,
    );
  }
  if (error instanceof ZodError) {
    return errorResponse(
      { error: "요청 값을 확인해주세요.", code: "INVALID_INPUT", requestId },
      400,
    );
  }

  const external = error as {
    status?: number;
    code?: string;
    name?: string;
  };
  if (external.status === 429 || external.code === "rate_limit_exceeded") {
    return errorResponse(
      { error: "요청이 많습니다. 잠시 후 다시 시도해주세요.", code: "AI_RATE_LIMITED", requestId },
      429,
    );
  }
  if (external.status === 401 || external.code === "invalid_api_key") {
    return errorResponse(
      { error: "AI 서비스 설정을 확인할 수 없습니다.", code: "AI_CONFIGURATION_ERROR", requestId },
      503,
    );
  }
  if (
    external.status === 408 ||
    external.code === "ETIMEDOUT" ||
    external.name === "AbortError"
  ) {
    return errorResponse(
      { error: "AI 응답이 지연되고 있습니다. 다시 시도해주세요.", code: "AI_TIMEOUT", requestId },
      504,
    );
  }
  if (external.status && external.status >= 500) {
    return errorResponse(
      { error: "AI 서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해주세요.", code: "AI_UNAVAILABLE", requestId },
      503,
    );
  }

  return errorResponse(
    { error: "서버에서 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.", code: "INTERNAL_ERROR", requestId },
    500,
  );
}

export async function handleApiRequest(
  request: Request,
  route: string,
  handler: () => Promise<Response>,
) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const startedAt = Date.now();
  let response: Response;
  let caughtError: unknown;

  try {
    response = await handler();
  } catch (error) {
    caughtError = error;
    response = apiErrorResponse(error, requestId);
  }

  response.headers.set("x-request-id", requestId);
  const external = caughtError as { code?: string; name?: string } | undefined;
  console.info(
    JSON.stringify({
      type: "api_request",
      requestId,
      route,
      method: request.method,
      status: response.status,
      durationMs: Date.now() - startedAt,
      errorType: external?.code ?? external?.name,
    }),
  );
  return response;
}
