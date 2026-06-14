"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { AnswerDialog } from "@/components/AnswerDialog";
import { ChatBubble, TypingBubble } from "@/components/ChatBubble";
import { ConfigGate } from "@/components/ConfigGate";
import { PixelPanel } from "@/components/PixelPanel";
import { ResultDialog } from "@/components/ResultDialog";
import { apiFetch } from "@/lib/client-api";
import type { AnswerResult, ChatMessage, GameSession } from "@/lib/types";
import { useDeviceId } from "@/lib/use-device-id";

export function GameScreen({ problemId }: { problemId: string }) {
  return <ConfigGate><GameContent problemId={problemId} /></ConfigGate>;
}

function GameContent({ problemId }: { problemId: string }) {
  const deviceId = useDeviceId();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [answerOpen, setAnswerOpen] = useState(false);
  const [answerError, setAnswerError] = useState<string>();
  const [result, setResult] = useState<GameSession | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sessionQuery = useQuery({
    queryKey: ["session", problemId, deviceId],
    enabled: Boolean(deviceId),
    queryFn: () => apiFetch<GameSession>("/api/sessions", { method: "POST", body: JSON.stringify({ problemId, deviceId }) }),
  });
  const session = sessionQuery.data;

  const chatMutation = useMutation({
    mutationFn: (message: string) => apiFetch<{ userMessage: ChatMessage; assistantMessage: ChatMessage; questionCount: number }>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ deviceId, sessionId: session?.id, message }),
    }),
    onMutate: (message) => setPendingText(message),
    onSuccess: (data) => {
      queryClient.setQueryData<GameSession>(["session", problemId, deviceId], (current) => current ? ({ ...current, conversationHistory: [...current.conversationHistory, data.userMessage, data.assistantMessage], questionCount: data.questionCount }) : current);
      setText("");
    },
    onSettled: () => setPendingText(null),
  });

  const answerMutation = useMutation({
    mutationFn: (answer: string) => apiFetch<AnswerResult>("/api/answers", { method: "POST", body: JSON.stringify({ deviceId, sessionId: session?.id, answer }) }),
    onSuccess: (data) => {
      if (data.isCorrect && data.session) {
        setAnswerOpen(false);
        setResult(data.session);
      } else {
        setAnswerError(data.feedback);
      }
    },
    onError: (error) => setAnswerError(error.message),
  });

  const giveUpMutation = useMutation({
    mutationFn: () => apiFetch<GameSession>(`/api/sessions/${session?.id}/give-up`, { method: "POST", body: JSON.stringify({ deviceId }) }),
    onSuccess: setResult,
  });

  const displayMessages = useMemo(() => {
    if (!pendingText) return session?.conversationHistory ?? [];
    return [...(session?.conversationHistory ?? []), { id: "pending", role: "user" as const, content: pendingText, createdAt: new Date().toISOString(), pending: true }];
  }, [pendingText, session?.conversationHistory]);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [displayMessages.length, chatMutation.isPending]);

  if (sessionQuery.isLoading || !deviceId) return <main className="app-shell grid place-items-center"><p className="loading-dots text-cyan-100">게임 연결 중</p></main>;
  if (sessionQuery.isError) return <main className="app-shell"><AppHeader /><PixelPanel className="p-7"><p className="error-text">{sessionQuery.error.message}</p></PixelPanel></main>;
  if (!session) return null;

  const busy = chatMutation.isPending || answerMutation.isPending || giveUpMutation.isPending;
  return (
    <main className="app-shell flex h-[100dvh] flex-col overflow-hidden">
      <AppHeader />
      <PixelPanel title="문제" className="mb-4 shrink-0 p-5 pt-7">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs">
          <span className="text-cyan-200">{session.problem.title}</span>
          <span className="rounded bg-white/5 px-2 py-1 text-[#a8f56a]">질문 {session.questionCount}</span>
        </div>
        <p className="max-h-28 overflow-y-auto leading-6 text-[#e8edff]">{session.problem.question}</p>
      </PixelPanel>

      <section className="min-h-0 flex-1 overflow-y-auto rounded border-2 border-[#27376a] bg-[#04091bd9] px-3 py-5 shadow-inner" aria-live="polite">
        {displayMessages.length === 0 ? <p className="muted px-5 py-12 text-center text-sm leading-6">진실을 찾기 위해 예 또는 아니오로 답할 수 있는 질문을 보내세요.</p> : null}
        <div className="space-y-5">
          {displayMessages.map((message) => <ChatBubble key={message.id} message={message} />)}
          {chatMutation.isPending ? <TypingBubble /> : null}
          <div ref={bottomRef} />
        </div>
      </section>

      <form className="mt-3 shrink-0" onSubmit={(event) => { event.preventDefault(); if (text.trim() && !busy) chatMutation.mutate(text.trim()); }}>
        <div className="flex gap-2">
          <input value={text} onChange={(event) => setText(event.target.value)} maxLength={300} disabled={busy} placeholder="추리를 입력하세요..." className="min-w-0 flex-1 rounded border-2 border-[#3c5289] bg-[#060c21] px-4 text-white placeholder:text-[#596480]" />
          <button className="pixel-button !px-5" disabled={busy || !text.trim()} type="submit">전송</button>
        </div>
        {chatMutation.isError ? <p className="error-text mt-2 text-xs">{chatMutation.error.message}</p> : null}
        {giveUpMutation.isError ? <p className="error-text mt-2 text-xs">{giveUpMutation.error.message}</p> : null}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button type="button" className="pixel-button gold" disabled={busy} onClick={() => { setAnswerError(undefined); setAnswerOpen(true); }}>정답</button>
          <button type="button" className="pixel-button violet" disabled={busy} onClick={() => { if (window.confirm("정말 포기하고 정답을 확인할까요?")) giveUpMutation.mutate(); }}>포기</button>
        </div>
      </form>
      <AnswerDialog open={answerOpen} loading={answerMutation.isPending} error={answerError} onClose={() => setAnswerOpen(false)} onSubmit={(answer) => answerMutation.mutate(answer)} />
      <ResultDialog session={result} />
    </main>
  );
}
