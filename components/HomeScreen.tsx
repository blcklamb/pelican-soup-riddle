"use client";

import Link from "next/link";
import { Archive, History, Radio } from "lucide-react";
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
        <div
          className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-2xl border border-[#2a3824] bg-[#121a10] text-[#7aaa6a]"
          aria-hidden="true"
        >
          <span aria-hidden="true" className="text-4xl">
            🐢
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#deded8]">
          Turtle Soup
        </h1>
        <p className="muted mt-1 text-sm">바다거북 스프 추리 게임</p>
      </header>

      <PixelPanel title="오늘의 문제" className="p-6 pt-8">
        {query.isLoading ? (
          <div className="h-44 animate-pulse rounded bg-white/5" />
        ) : null}
        {query.isError ? (
          <p className="error-text py-10 text-center">{query.error.message}</p>
        ) : null}
        {query.data ? (
          <div>
            <div className="mb-5 flex gap-2 text-xs font-medium">
              <span className="rounded-md border border-[#253022] bg-[#121a10] px-3 py-1 text-[#7aaa6a]">
                {query.data.category}
              </span>
              <span className="rounded-md border border-[#35280e] bg-[#1c1709] px-3 py-1 text-[#b89040]">
                {query.data.difficulty}
              </span>
            </div>
            <h2 className="mb-4 text-xl font-bold text-[#deded8]">{query.data.title}</h2>
            <p className="muted line-clamp-3 leading-7 text-sm">
              {query.data.question}
            </p>
            <Link
              href={`/game/${query.data.id}`}
              className="pixel-button mt-7 flex w-full items-center justify-center gap-2"
            >
              <Radio aria-hidden="true" size={17} />
              시작하기
            </Link>
          </div>
        ) : null}
      </PixelPanel>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link
          href="/problems"
          className="pixel-button flex items-center justify-center gap-2 px-3!"
        >
          <History aria-hidden="true" size={17} />
          이전 문제
        </Link>
        <Link
          href="/archive"
          className="pixel-button violet flex items-center justify-center gap-2 px-3!"
        >
          <Archive aria-hidden="true" size={17} />
          내 기록
        </Link>
      </div>
      <p className="muted mt-5 text-center text-xs leading-5">
        질문에는 예 · 아니오 · 관련 없음으로만 답합니다.
      </p>
    </main>
  );
}
