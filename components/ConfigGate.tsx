"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { apiFetch } from "@/lib/client-api";
import { SetupNotice } from "@/components/SetupNotice";

export function ConfigGate({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: ["config"],
    queryFn: () => apiFetch<{ configured: boolean; missing: string[] }>("/api/config"),
  });

  if (query.isLoading) {
    return <main className="app-shell flex items-center justify-center"><p className="loading-dots text-cyan-200">시스템 확인 중</p></main>;
  }
  if (query.isError) return <SetupNotice missing={["서버 설정 확인 실패"]} />;
  if (!query.data?.configured) return <SetupNotice missing={query.data?.missing ?? []} />;
  return children;
}
