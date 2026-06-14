"use client";

import { useEffect, useRef, useState } from "react";
import { Lightbulb, X } from "lucide-react";

export function AnswerDialog({
  open,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (answer: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} onCancel={onClose} className="m-auto w-[min(92vw,440px)] rounded-none bg-transparent p-0 backdrop:bg-[#02040bdd]">
      <form className="pixel-panel p-6 text-white" onSubmit={(event) => { event.preventDefault(); onSubmit(answer); }}>
        <p className="eyebrow mb-2">Final answer</p>
        <h2 className="mb-4 text-2xl font-black">정답을 말해보세요</h2>
        <textarea
          autoFocus
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          maxLength={1000}
          rows={5}
          placeholder="상황의 진실은..."
          className="w-full resize-none rounded border-2 border-[#38558d] bg-[#050b20] p-4 leading-6 text-white placeholder:text-[#596480]"
        />
        {error ? <p className="error-text mt-3 text-sm">{error}</p> : null}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" className="pixel-button ghost flex items-center justify-center gap-2" onClick={onClose}><X aria-hidden="true" size={18} />취소</button>
          <button type="submit" className="pixel-button gold flex items-center justify-center gap-2" disabled={loading || !answer.trim()}><Lightbulb aria-hidden="true" size={18} />{loading ? "판정 중..." : "정답 제출"}</button>
        </div>
      </form>
    </dialog>
  );
}
