"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock3, MessageCircleQuestion, ScrollText } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { ChatBubble } from "@/components/ChatBubble";
import { ConfigGate } from "@/components/ConfigGate";
import { PixelPanel } from "@/components/PixelPanel";
import { ProblemFeedbackForm } from "@/components/ProblemFeedbackForm";
import { apiFetch } from "@/lib/client-api";
import type { GameSession } from "@/lib/types";
import { useDeviceId } from "@/lib/use-device-id";
import { formatDuration, STATUS_LABELS } from "@/lib/utils";

export function ArchiveDetailScreen({ sessionId }: { sessionId: string }) {
  return (
    <ConfigGate>
      <ArchiveDetail sessionId={sessionId} />
    </ConfigGate>
  );
}

function ArchiveDetail({ sessionId }: { sessionId: string }) {
  const deviceId = useDeviceId();
  const query = useQuery({
    queryKey: ["session-detail", sessionId, deviceId],
    enabled: Boolean(deviceId),
    queryFn: () =>
      apiFetch<GameSession>(`/api/sessions/${sessionId}?deviceId=${deviceId}`),
  });

  if (query.isLoading || !deviceId)
    return (
      <main className="app-shell grid place-items-center">
        <p className="loading-dots">기록 복원 중</p>
      </main>
    );
  if (query.isError)
    return (
      <main className="app-shell">
        <AppHeader backHref="/archive" />
        <PixelPanel className="p-6">
          <p className="error-text">{query.error.message}</p>
        </PixelPanel>
      </main>
    );
  const session = query.data;
  if (!session) return null;

  return (
    <main className="app-shell py-6">
      <AppHeader backHref="/archive" />
      <PixelPanel title="사건 보고서" className="mb-5 p-5 pt-8">
        <div className="mb-3 flex justify-between gap-3">
          <h1 className="flex items-center gap-2 text-xl font-black">
            <ScrollText
              className="shrink-0 text-cyan-200"
              aria-hidden="true"
              size={20}
            />
            {session.problem.title}
          </h1>
          <span className="text-sm text-cyan-200">
            {STATUS_LABELS[session.status]}
          </span>
        </div>
        <p className="muted leading-7">{session.problem.question}</p>
      </PixelPanel>
      <section className="space-y-5 rounded border-2 border-[#27376a] bg-[#04091bd9] p-4">
        {session.conversationHistory.length ? (
          session.conversationHistory.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))
        ) : (
          <p className="muted py-8 text-center">질문 없이 종료된 사건입니다.</p>
        )}
      </section>
      <PixelPanel title="진실" className="mt-7 p-5 pt-8">
        <p className="mb-2 font-bold text-[#ffc936]">
          {session.solution?.answer}
        </p>
        <p className="muted leading-7">{session.solution?.explanation}</p>
        <div className="mt-5 flex gap-4 border-t border-white/10 pt-4 text-xs text-cyan-100">
          <span className="flex items-center gap-1">
            <MessageCircleQuestion aria-hidden="true" size={14} />
            질문 {session.questionCount}개
          </span>
          <span className="flex items-center gap-1">
            <Clock3 aria-hidden="true" size={14} />
            {formatDuration(session.startedAt, session.completedAt)}
          </span>
        </div>
        <ProblemFeedbackForm sessionId={session.id} />
      </PixelPanel>
    </main>
  );
}
