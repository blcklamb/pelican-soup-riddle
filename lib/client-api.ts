export class ClientApiError extends Error {}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ClientApiError(data.error ?? "요청에 실패했습니다.");
  return data as T;
}
