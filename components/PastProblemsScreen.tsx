"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Flag,
  History,
  Play,
  RotateCcw,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { ConfigGate } from "@/components/ConfigGate";
import { PixelPanel } from "@/components/PixelPanel";
import { apiFetch } from "@/lib/client-api";
import { buildPastProblemEntries } from "@/lib/problem-history";
import type { GameSession, PublicProblem } from "@/lib/types";
import { useDeviceId } from "@/lib/use-device-id";

const stateConfig = {
  in_progress: {
    label: "진행 중",
    action: "이어하기",
    className: "text-cyan-200",
    Icon: CircleDashed,
    ActionIcon: Play,
  },
  solved: {
    label: "해결 완료",
    action: "다시 풀기",
    className: "text-[#a8f56a]",
    Icon: CheckCircle2,
    ActionIcon: RotateCcw,
  },
  given_up: {
    label: "포기",
    action: "다시 도전",
    className: "text-[#c6a0ff]",
    Icon: Flag,
    ActionIcon: RotateCcw,
  },
} as const;

export function PastProblemsScreen() {
  return (
    <ConfigGate>
      <PastProblemsContent />
    </ConfigGate>
  );
}

function PastProblemsContent() {
  const deviceId = useDeviceId();
  const problemsQuery = useQuery({
    queryKey: ["problems"],
    queryFn: () => apiFetch<PublicProblem[]>("/api/problems"),
  });
  const dailyQuery = useQuery({
    queryKey: ["daily-problem"],
    queryFn: () => apiFetch<PublicProblem>("/api/problems/daily"),
  });
  const sessionsQuery = useQuery({
    queryKey: ["sessions", deviceId],
    enabled: Boolean(deviceId),
    queryFn: () =>
      apiFetch<GameSession[]>(`/api/sessions?deviceId=${deviceId}`),
  });

  const loading =
    problemsQuery.isLoading || dailyQuery.isLoading || sessionsQuery.isLoading;
  const error = problemsQuery.error ?? dailyQuery.error ?? sessionsQuery.error;
  const entries =
    problemsQuery.data && dailyQuery.data
      ? buildPastProblemEntries(
          problemsQuery.data,
          dailyQuery.data.id,
          sessionsQuery.data ?? [],
        )
      : [];

  return (
    <main className="app-shell py-6">
      <AppHeader />
      <header className="mb-8 text-center">
        <History
          className="mx-auto mb-3 text-cyan-200"
          aria-hidden="true"
          size={40}
        />
        <h1 className="text-3xl font-black">이전 문제</h1>
        <p className="muted mt-2 text-sm">발행된 사건을 골라 다시 조사하세요.</p>
      </header>

      <PixelPanel title="지난 사건" className="p-5 pt-8">
        {loading ? (
          <p className="loading-dots py-16 text-center text-cyan-100">
            문제 불러오는 중
          </p>
        ) : null}
        {error ? (
          <p className="error-text py-12 text-center">{error.message}</p>
        ) : null}
        {!loading && !error && entries.length === 0 ? (
          <p className="muted py-14 text-center">
            아직 이전에 발행된 문제가 없습니다.
          </p>
        ) : null}

        <div className="space-y-4">
          {entries.map(({ problem, latestSession }) => {
            const state = latestSession
              ? stateConfig[latestSession.status]
              : undefined;
            const ActionIcon = state?.ActionIcon ?? Play;
            return (
              <article
                key={problem.id}
                className="rounded border-2 border-[#263d77] bg-[#07102d] p-4 shadow-[inset_0_0_18px_rgba(40,90,190,.08)]"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="mb-1 flex items-center gap-1.5 text-xs text-[#8fa7d8]">
                      <CalendarDays aria-hidden="true" size={13} />
                      {new Intl.DateTimeFormat("ko-KR", {
                        dateStyle: "medium",
                      }).format(new Date(`${problem.releaseDate}T00:00:00`))}
                    </p>
                    <h2 className="text-lg font-black text-white">
                      {problem.title}
                    </h2>
                  </div>
                  {state ? (
                    <span
                      className={`flex shrink-0 items-center gap-1 text-xs font-bold ${state.className}`}
                    >
                      <state.Icon aria-hidden="true" size={15} />
                      {state.label}
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs font-bold text-[#ffc936]">
                      미도전
                    </span>
                  )}
                </div>
                <p className="muted line-clamp-2 text-sm leading-6">
                  {problem.question}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex gap-2 text-[10px] font-bold">
                    <span className="rounded bg-cyan-400/10 px-2 py-1 text-cyan-200">
                      {problem.category}
                    </span>
                    <span className="rounded bg-yellow-400/10 px-2 py-1 text-yellow-200">
                      {problem.difficulty}
                    </span>
                  </div>
                  <Link
                    href={`/game/${problem.id}`}
                    className="pixel-button flex min-h-11! items-center justify-center gap-2 px-4! py-2! text-sm"
                  >
                    <ActionIcon aria-hidden="true" size={16} />
                    {state?.action ?? "풀어보기"}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </PixelPanel>
    </main>
  );
}
