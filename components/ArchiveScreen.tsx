"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleDashed, Clock3, Flag, Inbox, MessageCircleQuestion } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { ConfigGate } from "@/components/ConfigGate";
import { PixelPanel } from "@/components/PixelPanel";
import { apiFetch } from "@/lib/client-api";
import type { GameSession } from "@/lib/types";
import { useDeviceId } from "@/lib/use-device-id";
import { formatDuration, STATUS_LABELS } from "@/lib/utils";

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
  const query = useQuery({
    queryKey: ["sessions", deviceId],
    enabled: Boolean(deviceId),
    queryFn: () => apiFetch<GameSession[]>(`/api/sessions?deviceId=${deviceId}`),
  });

  return (
    <main className="app-shell py-6">
      <AppHeader />
      <PixelPanel title="사건 기록" className="p-5 pt-8">
        {query.isLoading ? <p className="loading-dots py-16 text-center text-cyan-100">기록 복원 중</p> : null}
        {query.isError ? <p className="error-text py-12 text-center">{query.error.message}</p> : null}
        {query.data?.length === 0 ? <div className="py-14 text-center"><Inbox className="mx-auto mb-3 text-[#596b9b]" aria-hidden="true" size={44} /><p className="muted">아직 조사한 사건이 없습니다.</p></div> : null}
        <div className="space-y-3">
          {query.data?.map((session) => {
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
      </PixelPanel>
    </main>
  );
}
