"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Archive, CheckCircle2, Clock3, Flag, Home, MessageCircleQuestion } from "lucide-react";
import type { GameSession } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

export function ResultDialog({ session }: { session: GameSession | null }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (session && ref.current && !ref.current.open) ref.current.showModal();
  }, [session]);
  if (!session) return null;

  const solved = session.status === "solved";
  return (
    <dialog ref={ref} className="m-auto w-[min(92vw,460px)] rounded-none bg-transparent p-0 backdrop:bg-[#02040bee]">
      <section className="pixel-panel max-h-[88dvh] overflow-y-auto p-6 text-white">
        {solved ? <CheckCircle2 className="mx-auto mb-3 text-[#a8f56a]" aria-hidden="true" size={50} /> : <Flag className="mx-auto mb-3 text-[#c6a0ff]" aria-hidden="true" size={50} />}
        <p className="eyebrow text-center">Case closed</p>
        <h2 className={`mb-6 text-center text-2xl font-black ${solved ? "text-[#a8f56a]" : "text-[#c6a0ff]"}`}>{solved ? "정답입니다!" : "진실을 공개합니다"}</h2>
        <div className="space-y-5 leading-7">
          <div><p className="mb-1 text-sm font-bold text-[#ffc936]">정답</p><p>{session.solution?.answer}</p></div>
          <div><p className="mb-1 text-sm font-bold text-[#39dff5]">해설</p><p className="muted">{session.solution?.explanation}</p></div>
          <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-center text-sm">
            <div className="rounded bg-white/5 p-3"><MessageCircleQuestion className="mx-auto mb-1 text-cyan-200" aria-hidden="true" size={18} /><strong className="block text-xl text-white">{session.questionCount}</strong><span className="muted">질문 수</span></div>
            <div className="rounded bg-white/5 p-3"><Clock3 className="mx-auto mb-1 text-cyan-200" aria-hidden="true" size={18} /><strong className="block text-lg text-white">{formatDuration(session.startedAt, session.completedAt)}</strong><span className="muted">소요 시간</span></div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link className="pixel-button ghost flex items-center justify-center gap-2" href="/"><Home aria-hidden="true" size={18} />홈으로</Link>
          <Link className="pixel-button flex items-center justify-center gap-2" href="/archive"><Archive aria-hidden="true" size={18} />기록 보기</Link>
        </div>
      </section>
    </dialog>
  );
}
