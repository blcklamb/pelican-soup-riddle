"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleDashed, Clock3, Flag, Inbox, MessageCircleQuestion } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { ConfigGate } from "@/components/ConfigGate";
import { PixelPanel } from "@/components/PixelPanel";
import { apiFetch } from "@/lib/client-api";
import { getArchiveStats, groupSessionsByDate } from "@/lib/archive";
import type { GameSession } from "@/lib/types";
import { useDeviceId } from "@/lib/use-device-id";
import { formatDuration, STATUS_LABELS } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/utils";

const statusStyle = {
  solved: "text-[#a8f56a]",
  in_progress: "text-[#39dff5]",
  given_up: "text-[#c6a0ff]",
};

const statusIcon = {
  solved: CheckCircle2,
  in_progress: CircleDashed,
  given_up: Flag,
};

export function ArchiveScreen() {
  return <ConfigGate><ArchiveContent /></ConfigGate>;
}

function ArchiveContent() {
  const deviceId = useDeviceId();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [category, setCategory] = useState("all");
  const query = useQuery({
    queryKey: ["sessions", deviceId],
    enabled: Boolean(deviceId),
    queryFn: () => apiFetch<GameSession[]>(`/api/sessions?deviceId=${deviceId}`),
  });
  const filteredSessions = useMemo(
    () =>
      (query.data ?? []).filter((session) => {
        const matchesSearch = session.problem.title
          .toLocaleLowerCase("ko-KR")
          .includes(search.trim().toLocaleLowerCase("ko-KR"));
        return (
          matchesSearch &&
          (status === "all" || session.status === status) &&
          (difficulty === "all" || session.problem.difficulty === difficulty) &&
          (category === "all" || session.problem.category === category)
        );
      }),
    [category, difficulty, query.data, search, status],
  );
  const groups = groupSessionsByDate(filteredSessions);
  const stats = getArchiveStats(query.data ?? []);

  return (
    <main className="app-shell py-6">
      <AppHeader />
      {query.data?.length ? (
        <section className="mb-5 grid grid-cols-2 gap-2" aria-label="게임 통계">
          <div className="pixel-panel p-3 text-center"><strong className="block text-xl text-[#a8f56a]">{stats.solved}</strong><span className="muted text-[11px]">해결</span></div>
          <div className="pixel-panel p-3 text-center"><strong className="block text-xl text-[#c6a0ff]">{stats.givenUp}</strong><span className="muted text-[11px]">포기</span></div>
          <div className="pixel-panel p-3 text-center"><strong className="block text-xl text-[#39dff5]">{stats.averageQuestions}</strong><span className="muted text-[11px]">평균 질문</span></div>
          <div className="pixel-panel p-3 text-center"><strong className="block text-xl text-[#b89040]">{stats.solveRate}%</strong><span className="muted text-[11px]">해결률</span></div>
          <div className="pixel-panel p-3 text-center"><strong className="block text-xl text-[#deded8]">{stats.maxStreak}일</strong><span className="muted text-[11px]">최장 연속 참여</span></div>
        </section>
      ) : null}
      {stats.categoryStats.length ? (
        <section className="mb-5 pixel-panel p-4" aria-label="카테고리별 성적">
          <h2 className="mb-3 text-sm font-bold">카테고리별 성적</h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {stats.categoryStats.map((item) => <div key={item.category} className="flex justify-between rounded border border-[#22222e] bg-[#0e0e14] p-2"><span>{CATEGORY_LABELS[item.category] ?? item.category}</span><span className="muted">{item.solved}/{item.played} 해결</span></div>)}
          </div>
        </section>
      ) : null}
      <PixelPanel title="사건 기록" className="p-5 pt-8">
        {query.data?.length ? (
          <div className="mb-5 space-y-3" aria-label="기록 필터">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="문제명 검색"
              className="min-h-11 w-full rounded-lg border border-[#22222e] bg-[#0e0e14] px-3 text-sm"
            />
            <div className="grid grid-cols-3 gap-2">
              <select aria-label="상태 필터" value={status} onChange={(event) => setStatus(event.target.value)} className="min-w-0 rounded-lg border border-[#22222e] bg-[#0e0e14] p-2 text-xs">
                <option value="all">모든 상태</option><option value="in_progress">진행 중</option><option value="solved">해결</option><option value="given_up">포기</option>
              </select>
              <select aria-label="난이도 필터" value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="min-w-0 rounded-lg border border-[#22222e] bg-[#0e0e14] p-2 text-xs">
                <option value="all">모든 난이도</option><option value="Easy">쉬움</option><option value="Medium">보통</option><option value="Hard">어려움</option>
              </select>
              <select aria-label="카테고리 필터" value={category} onChange={(event) => setCategory(event.target.value)} className="min-w-0 rounded-lg border border-[#22222e] bg-[#0e0e14] p-2 text-xs">
                <option value="all">모든 분류</option><option value="Paradox">역설</option><option value="Weird">기묘</option><option value="Logic">논리</option><option value="Mystery">미스터리</option>
              </select>
            </div>
          </div>
        ) : null}
        {query.isLoading ? <p className="loading-dots py-16 text-center text-cyan-100">기록 복원 중</p> : null}
        {query.isError ? <p className="error-text py-12 text-center">{query.error.message}</p> : null}
        {query.data?.length === 0 ? <div className="py-14 text-center"><Inbox className="mx-auto mb-3 text-[#596b9b]" aria-hidden="true" size={44} /><p className="muted">아직 조사한 사건이 없습니다.</p></div> : null}
        {query.data?.length && filteredSessions.length === 0 ? <p className="muted py-12 text-center">조건에 맞는 기록이 없습니다.</p> : null}
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.date}>
              <h2 className="muted mb-2 text-xs font-bold tracking-wider">
                {new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" }).format(new Date(`${group.date}T00:00:00+09:00`))}
              </h2>
              <div className="space-y-3">
              {group.sessions.map((session) => {
            const StatusIcon = statusIcon[session.status];
            return (
            <Link key={session.id} href={session.status === "in_progress" ? `/game/${session.problemId}` : `/archive/${session.id}`} className="block rounded border-2 border-[#263d77] bg-[#07102d] p-4 transition hover:border-cyan-400 hover:bg-[#0b1940]">
              <div className="mb-2 flex items-start justify-between gap-3">
                <h2 className="font-black text-white">{session.problem.title}</h2>
                <span className={`flex shrink-0 items-center gap-1.5 text-xs font-bold ${statusStyle[session.status]}`}><StatusIcon aria-hidden="true" size={15} />{STATUS_LABELS[session.status]}</span>
              </div>
              <div className="muted flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(session.createdAt))}</span>
                <span className="flex items-center gap-1"><MessageCircleQuestion aria-hidden="true" size={13} />질문 {session.questionCount}개</span>
                <span className="flex items-center gap-1"><Clock3 aria-hidden="true" size={13} />{formatDuration(session.startedAt, session.completedAt)}</span>
              </div>
            </Link>
            );
              })}
              </div>
            </section>
          ))}
        </div>
      </PixelPanel>
    </main>
  );
}
