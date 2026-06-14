export class ClientApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public requestId?: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const accessToken = await getAccessToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ClientApiError(
      data.error ?? "요청에 실패했습니다.",
      response.status,
      data.code,
      data.requestId,
      data.details,
    );
  }
  return data as T;
}
import { getAccessToken } from "@/lib/browser-supabase";
