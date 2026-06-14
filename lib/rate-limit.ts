import { ApiError } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase";

type RateLimitOptions = {
  scope: string;
  deviceId: string;
  limit: number;
  windowSeconds: number;
};

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function enforceRateLimit(
  request: Request,
  options: RateLimitOptions,
) {
  const identities = await Promise.all([
    digest(`ip:${getClientIp(request)}`),
    digest(`device:${options.deviceId}`),
  ]);

  for (const identity of identities) {
    const { data, error } = await createServiceClient().rpc(
      "consume_api_rate_limit",
      {
        p_key: `${options.scope}:${identity}`,
        p_window_seconds: options.windowSeconds,
        p_limit: options.limit,
      },
    );
    if (error) throw error;

    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.allowed) {
      throw new ApiError(
        "요청이 많습니다. 잠시 후 다시 시도해주세요.",
        429,
        "RATE_LIMITED",
        { retryAfter: Number(result?.retry_after_seconds ?? 1) },
      );
    }
  }
}
