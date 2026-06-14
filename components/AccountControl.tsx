"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/browser-supabase";

export function AccountControl() {
  const supabase = createBrowserSupabaseClient();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setConnected(Boolean(data.session));
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setConnected(Boolean(session));
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  async function toggleConnection() {
    setLoading(true);
    if (connected) await supabase.auth.signOut();
    else await supabase.auth.signInAnonymously();
    setLoading(false);
    window.location.reload();
  }

  return (
    <button
      type="button"
      className="pixel-button ghost flex min-h-10! items-center justify-center gap-2 px-3! py-2! text-xs"
      disabled={loading}
      onClick={toggleConnection}
      title={connected ? "이 브라우저에서 계정 사용을 종료합니다." : "이후 생성되는 기록을 익명 계정에 저장합니다."}
    >
      {connected ? <Cloud aria-hidden="true" size={15} /> : <CloudOff aria-hidden="true" size={15} />}
      {connected ? "계정 사용 중" : "계정 사용"}
    </button>
  );
}
