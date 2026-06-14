"use client";

import { createClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createClient> | undefined;

export function createBrowserSupabaseClient() {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}

export async function getAccessToken() {
  const { data } = await createBrowserSupabaseClient().auth.getSession();
  return data.session?.access_token;
}
