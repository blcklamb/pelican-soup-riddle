import type { User } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase";

export type RequestIdentity = {
  deviceId: string;
  userId: string | null;
};

export async function getOptionalUser(request: Request): Promise<User | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length);
  const { data, error } = await createServiceClient().auth.getUser(token);
  if (error) return null;
  return data.user;
}

export async function resolveRequestIdentity(
  request: Request,
  deviceId: string,
): Promise<RequestIdentity> {
  const user = await getOptionalUser(request);
  if (user) {
    const { error } = await createServiceClient().rpc("claim_device_sessions", {
      p_user_id: user.id,
      p_device_id: deviceId,
    });
    if (error) throw error;
  }
  return { deviceId, userId: user?.id ?? null };
}
