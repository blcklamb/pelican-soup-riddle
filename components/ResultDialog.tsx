"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Archive, CheckCircle2, Clock3, Flag, Home, MessageCircleQuestion, RotateCcw, Share2 } from "lucide-react";
import type { GameSession } from "@/lib/types";
import { ProblemFeedbackForm } from "@/components/ProblemFeedbackForm";
import { DIFFICULTY_LABELS, formatDuration } from "@/lib/utils";

export function getResultShareText(
  session: Pick<GameSession, "status" | "questionCount" | "hintCount">,
) {
  const result = session.status === "solved" ? "해결했어요" : "진실을 확인했어요";
  return `Turtle Soup AI 문제를 질문 ${session.questionCount}개, 힌트 ${session.hintCount}개로 ${result}.`;
}

export function ResultDialog({ session }: { session: GameSession | null }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [shareState, setShareState] = useState({ sessionId: "", label: "공유" });
  useEffect(() => {
    if (session && ref.current && !ref.current.open) ref.current.showModal();
  }, [session]);
  if (!session) return null;

  const solved = session.status === "solved";
  const shareLabel = shareState.sessionId === session.id ? shareState.label : "공유";
  async function shareResult() {
    const text = getResultShareText(session!);
    try {
      if (navigator.share) {
        await navigator.share({ title: "Turtle Soup AI", text, url: `${window.location.origin}/game/${session?.problemId}` });
      } else {
        await navigator.clipboard.writeText(`${text} ${window.location.origin}/game/${session?.problemId}`);
        setShareState({ sessionId: session!.id, label: "복사됨" });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareState({ sessionId: session!.id, label: "실패" });
    }
  }
  return (
    <dialog ref={ref} aria-labelledby="result-dialog-title" className="m-auto w-[min(92vw,460px)] rounded-none bg-transparent p-0 backdrop:bg-black/70">
      <section className="pixel-panel max-h-[88dvh] overflow-y-auto p-6 text-[#deded8]">
        {solved ? <CheckCircle2 className="mx-auto mb-3 text-[#7aaa6a]" aria-hidden="true" size={44} /> : <Flag className="mx-auto mb-3 text-[#8872b0]" aria-hidden="true" size={44} />}
        <p className="eyebrow text-center">사건 종료</p>
        <h2 id="result-dialog-title" className={`mb-6 text-center text-xl font-bold ${solved ? "text-[#7aaa6a]" : "text-[#8872b0]"}`}>{solved ? "정답입니다!" : "진실을 공개합니다"}</h2>
        <div className="space-y-5 leading-7">
          <div><p className="mb-1 text-xs font-medium text-[#b89040] uppercase tracking-wider">정답</p><p className="text-sm">{session.solution?.answer}</p></div>
          <div><p className="mb-1 text-xs font-medium text-[#62627a] uppercase tracking-wider">해설</p><p className="muted text-sm">{session.solution?.explanation}</p></div>
          <div className="grid grid-cols-2 gap-3 border-t border-white/8 pt-5 text-center text-sm">
            <div className="rounded-lg border border-[#22222e] bg-[#0e0e14] p-3"><MessageCircleQuestion className="mx-auto mb-1 text-[#62627a]" aria-hidden="true" size={17} /><strong className="block text-xl text-[#deded8]">{session.questionCount}</strong><span className="muted text-xs">질문 수</span></div>
            <div className="rounded-lg border border-[#22222e] bg-[#0e0e14] p-3"><Clock3 className="mx-auto mb-1 text-[#62627a]" aria-hidden="true" size={17} /><strong className="block text-lg text-[#deded8]">{formatDuration(session.startedAt, session.completedAt)}</strong><span className="muted text-xs">소요 시간</span></div>
            <div className="rounded-lg border border-[#22222e] bg-[#0e0e14] p-3"><strong className="block text-sm text-[#b89040]">{DIFFICULTY_LABELS[session.problem.difficulty] ?? session.problem.difficulty}</strong><span className="muted text-xs">난이도</span></div>
            <div className="rounded-lg border border-[#22222e] bg-[#0e0e14] p-3"><strong className="block text-xl text-[#deded8]">{session.hintCount}</strong><span className="muted text-xs">힌트 사용</span></div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button autoFocus className="pixel-button flex items-center justify-center gap-2" type="button" onClick={() => window.location.assign(`/game/${session.problemId}`)}><RotateCcw aria-hidden="true" size={18} />다시 풀기</button>
          <button className="pixel-button flex items-center justify-center gap-2" type="button" onClick={shareResult}><Share2 aria-hidden="true" size={18} />{shareLabel}</button>
          <Link className="pixel-button ghost flex items-center justify-center gap-2" href="/"><Home aria-hidden="true" size={18} />홈으로</Link>
          <Link className="pixel-button flex items-center justify-center gap-2" href="/archive"><Archive aria-hidden="true" size={18} />기록 보기</Link>
        </div>
        <ProblemFeedbackForm sessionId={session.id} />
      </section>
    </dialog>
  );
}
