"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ConfigGate } from "@/components/ConfigGate";
import { PixelPanel } from "@/components/PixelPanel";
import { apiFetch } from "@/lib/client-api";
import type { PublicProblem } from "@/lib/types";

export function HomeScreen() {
  return (
    <ConfigGate>
      <HomeContent />
    </ConfigGate>
  );
}

function HomeContent() {
  const query = useQuery({
    queryKey: ["daily-problem"],
    queryFn: () => apiFetch<PublicProblem>("/api/problems/daily"),
  });

  return (
    <main className="app-shell flex flex-col justify-center py-10">
      <header className="mb-12 text-center">
        <div className="mx-auto mb-4 grid h-24 w-24 place-items-center rounded-full border-4 border-[#8df66c] bg-[#0b301e] text-6xl shadow-[0_0_28px_rgba(132,255,110,.34)]" aria-hidden="true">🐢</div>
        <p className="eyebrow mb-2">Daily Mystery Channel</p>
        <h1 className="text-4xl font-black tracking-tight text-white">TURTLE SOUP</h1>
        <p className="mt-2 font-bold text-[#a8f56a]">AI 추리 통신을 시작합니다</p>
      </header>

      <PixelPanel title="오늘의 문제" className="p-6 pt-8">
        {query.isLoading ? <div className="h-44 animate-pulse rounded bg-white/5" /> : null}
        {query.isError ? <p className="error-text py-10 text-center">{query.error.message}</p> : null}
        {query.data ? (
          <div>
            <div className="mb-5 flex gap-2 text-xs font-bold">
              <span className="rounded bg-cyan-400/15 px-3 py-1 text-cyan-200">{query.data.category}</span>
              <span className="rounded bg-yellow-400/15 px-3 py-1 text-yellow-200">{query.data.difficulty}</span>
            </div>
            <h2 className="mb-4 text-2xl font-black">{query.data.title}</h2>
            <p className="muted line-clamp-3 leading-7">{query.data.question}</p>
            <Link href={`/game/${query.data.id}`} className="pixel-button mt-7 block w-full">통신 시작</Link>
          </div>
        ) : null}
      </PixelPanel>

      <Link href="/archive" className="pixel-button violet mt-6 block w-full">지난 사건 기록</Link>
      <p className="muted mt-6 text-center text-xs leading-5">질문에는 예 · 아니오 · 관련 없음으로만 답합니다.</p>
    </main>
  );
}
