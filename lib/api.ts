import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "요청 값을 확인해주세요." }, { status: 400 });
  }

  const external = error as {
    status?: number;
    code?: string;
    name?: string;
  };
  if (external.status === 429 || external.code === "rate_limit_exceeded") {
    return NextResponse.json(
      { error: "요청이 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 },
    );
  }
  if (external.status === 401 || external.code === "invalid_api_key") {
    console.error(error);
    return NextResponse.json(
      { error: "AI 서비스 설정을 확인할 수 없습니다." },
      { status: 503 },
    );
  }
  if (
    external.status === 408 ||
    external.code === "ETIMEDOUT" ||
    external.name === "AbortError"
  ) {
    return NextResponse.json(
      { error: "AI 응답이 지연되고 있습니다. 다시 시도해주세요." },
      { status: 504 },
    );
  }
  if (external.status && external.status >= 500) {
    return NextResponse.json(
      { error: "AI 서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해주세요." },
      { status: 503 },
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: "서버에서 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요." },
    { status: 500 },
  );
}
