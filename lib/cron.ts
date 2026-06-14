import { timingSafeEqual } from "node:crypto";
import { ApiError } from "@/lib/api";
import { getCronSecret } from "@/lib/env";

function secretsMatch(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export function assertCronAuthorized(request: Request) {
  const authorization = request.headers.get("authorization");
  const expected = `Bearer ${getCronSecret()}`;

  if (!authorization || !secretsMatch(authorization, expected)) {
    throw new ApiError("Cron 인증에 실패했습니다.", 401);
  }
}
