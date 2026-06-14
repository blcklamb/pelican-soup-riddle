"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Flag, Lightbulb, MessageCircleQuestion, Send } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { AnswerDialog } from "@/components/AnswerDialog";
import { ChatBubble, TypingBubble } from "@/components/ChatBubble";
import { ConfigGate } from "@/components/ConfigGate";
import { PixelPanel } from "@/components/PixelPanel";
import { QuestionLimitNotice } from "@/components/QuestionLimitNotice";
import { ResultDialog } from "@/components/ResultDialog";
import { SessionTimeoutDialog } from "@/components/SessionTimeoutDialog";
import { apiFetch } from "@/lib/client-api";
import type { AnswerResult, ChatMessage, GameSession } from "@/lib/types";
import { useDeviceId } from "@/lib/use-device-id";
import {
  getRemainingQuestions,
  hasReachedQuestionLimit,
  MAX_QUESTIONS_PER_SESSION,
} from "@/lib/game-policy";

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
  const [now, setNow] = useState(() => Date.now());
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

  const extendMutation = useMutation({
    mutationFn: () =>
      apiFetch<GameSession>(`/api/sessions/${session?.id}/extend`, {
        method: "POST",
        body: JSON.stringify({ deviceId }),
      }),
    onSuccess: (extendedSession) => {
      setAnswerOpen(false);
      queryClient.setQueryData(
        ["session", problemId, deviceId],
        extendedSession,
      );
    },
  });

  const displayMessages = useMemo(() => {
    if (!pendingText) return session?.conversationHistory ?? [];
    return [...(session?.conversationHistory ?? []), { id: "pending", role: "user" as const, content: pendingText, createdAt: new Date().toISOString(), pending: true }];
  }, [pendingText, session?.conversationHistory]);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [displayMessages.length, chatMutation.isPending]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  if (sessionQuery.isLoading || !deviceId) return <main className="app-shell grid place-items-center"><p className="loading-dots text-cyan-100">게임 연결 중</p></main>;
  if (sessionQuery.isError) return <main className="app-shell"><AppHeader /><PixelPanel className="p-7"><p className="error-text">{sessionQuery.error.message}</p></PixelPanel></main>;
  if (!session) return null;

  const sessionExpired = new Date(session.expiresAt).getTime() <= now;
  const remainingSeconds = Math.max(
    0,
    Math.ceil((new Date(session.expiresAt).getTime() - now) / 1_000),
  );
  const remainingLabel = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;
  const remainingQuestions = getRemainingQuestions(session.questionCount);
  const questionLimitReached = hasReachedQuestionLimit(session.questionCount);
  const questionUsage = Math.min(
    100,
    (session.questionCount / MAX_QUESTIONS_PER_SESSION) * 100,
  );
  const busy = chatMutation.isPending || answerMutation.isPending || giveUpMutation.isPending || extendMutation.isPending;
  return (
    <main className="app-shell flex h-[100dvh] flex-col overflow-hidden">
      <AppHeader />
      <PixelPanel title="문제" className="mb-4 shrink-0 p-5 pt-7">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs">
          <span className="text-cyan-200">{session.problem.title}</span>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 rounded bg-white/5 px-2 py-1 ${remainingSeconds <= 60 ? "text-[#ffc936]" : "text-cyan-200"}`}><Clock3 aria-hidden="true" size={13} />{remainingLabel}</span>
            <span className={`flex items-center gap-1 rounded bg-white/5 px-2 py-1 ${remainingQuestions <= 5 ? "text-[#ffc936]" : "text-[#a8f56a]"}`}><MessageCircleQuestion aria-hidden="true" size={13} />질문 {session.questionCount}/{MAX_QUESTIONS_PER_SESSION}</span>
          </div>
        </div>
        <p className="max-h-28 overflow-y-auto leading-6 text-[#e8edff]">{session.problem.question}</p>
        <div className="mt-4" aria-label={`남은 질문 ${remainingQuestions}개`}>
          <div className="mb-1 flex justify-between text-[10px]">
            <span className="muted">질문 사용량</span>
            <span className={remainingQuestions <= 5 ? "text-[#ffc936]" : "text-[#a8f56a]"}>남은 질문 {remainingQuestions}개</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
            <div
              className={`h-full transition-[width] ${remainingQuestions <= 5 ? "bg-[#ffc936]" : "bg-[#8df66c]"}`}
              style={{ width: `${questionUsage}%` }}
            />
          </div>
        </div>
      </PixelPanel>

      <section className="min-h-0 flex-1 overflow-y-auto rounded border-2 border-[#27376a] bg-[#04091bd9] px-3 py-5 shadow-inner" aria-live="polite">
        {displayMessages.length === 0 ? <p className="muted px-5 py-12 text-center text-sm leading-6">진실을 찾기 위해 예 또는 아니오로 답할 수 있는 질문을 보내세요.</p> : null}
        <div className="space-y-5">
          {displayMessages.map((message) => <ChatBubble key={message.id} message={message} />)}
          {chatMutation.isPending ? <TypingBubble /> : null}
          <div ref={bottomRef} />
        </div>
      </section>

      <form className="mt-3 shrink-0" onSubmit={(event) => { event.preventDefault(); if (text.trim() && !busy && !sessionExpired && !questionLimitReached) chatMutation.mutate(text.trim()); }}>
        {questionLimitReached ? (
          <QuestionLimitNotice />
        ) : (
          <div className="flex gap-2">
            <input value={text} onChange={(event) => setText(event.target.value)} maxLength={300} disabled={busy || sessionExpired} placeholder={`추리를 입력하세요... (남은 ${remainingQuestions}개)`} className="min-w-0 flex-1 rounded border-2 border-[#3c5289] bg-[#060c21] px-4 text-white placeholder:text-[#596480]" />
            <button aria-label="질문 전송" className="pixel-button flex items-center justify-center gap-2 !px-5" disabled={busy || sessionExpired || !text.trim()} type="submit"><Send aria-hidden="true" size={18} /><span className="hidden min-[420px]:inline">전송</span></button>
          </div>
        )}
        {chatMutation.isError ? <p className="error-text mt-2 text-xs">{chatMutation.error.message}</p> : null}
        {giveUpMutation.isError ? <p className="error-text mt-2 text-xs">{giveUpMutation.error.message}</p> : null}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button type="button" className="pixel-button gold flex items-center justify-center gap-2" disabled={busy || sessionExpired} onClick={() => { setAnswerError(undefined); setAnswerOpen(true); }}><Lightbulb aria-hidden="true" size={20} />정답</button>
          <button type="button" className="pixel-button violet flex items-center justify-center gap-2" disabled={busy || sessionExpired} onClick={() => { if (window.confirm("정말 포기하고 정답을 확인할까요?")) giveUpMutation.mutate(); }}><Flag aria-hidden="true" size={20} />포기</button>
        </div>
      </form>
      <AnswerDialog open={answerOpen && !sessionExpired} loading={answerMutation.isPending} error={answerError} onClose={() => setAnswerOpen(false)} onSubmit={(answer) => answerMutation.mutate(answer)} />
      <SessionTimeoutDialog
        open={sessionExpired && !result}
        extending={extendMutation.isPending}
        givingUp={giveUpMutation.isPending}
        error={extendMutation.isError ? extendMutation.error.message : giveUpMutation.isError ? giveUpMutation.error.message : undefined}
        onExtend={() => extendMutation.mutate()}
        onGiveUp={() => giveUpMutation.mutate()}
      />
      <ResultDialog session={result} />
    </main>
  );
}
