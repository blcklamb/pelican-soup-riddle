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

  console.error(error);
  return NextResponse.json(
    { error: "서버에서 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요." },
    { status: 500 },
  );
}
