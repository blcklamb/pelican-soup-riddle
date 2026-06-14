"use client";

import { useEffect, useRef } from "react";
import { Clock3, Flag, RefreshCw } from "lucide-react";

export function SessionTimeoutDialog({
  open,
  extending,
  givingUp,
  error,
  onExtend,
  onGiveUp,
  canExtend,
}: {
  open: boolean;
  extending: boolean;
  givingUp: boolean;
  error?: string;
  onExtend: () => void;
  onGiveUp: () => void;
  canExtend: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const busy = extending || givingUp;
  return (
    <dialog
      ref={ref}
      aria-labelledby="timeout-dialog-title"
      onCancel={(event) => event.preventDefault()}
      className="m-auto w-[min(92vw,440px)] rounded-none bg-transparent p-0 backdrop:bg-black/70"
    >
      <section className="pixel-panel p-6 text-center text-[#deded8]">
        <Clock3
          className="mx-auto mb-4 text-[#b89040]"
          aria-hidden="true"
          size={40}
        />
        <p className="eyebrow mb-2">세션 만료</p>
        <h2 id="timeout-dialog-title" className="mb-3 text-xl font-bold">20분이 지났습니다</h2>
        <p className="muted leading-7">
          계속 추리하려면 세션을 20분 연장하세요. 포기하면 정답과 해설이
          공개됩니다.
        </p>
        {error ? <p className="error-text mt-4 text-sm">{error}</p> : null}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="pixel-button flex items-center justify-center gap-2"
            disabled={busy || !canExtend}
            onClick={onExtend}
          >
            <RefreshCw
              className={extending ? "animate-spin" : ""}
              aria-hidden="true"
              size={19}
            />
            {extending ? "연장 중" : canExtend ? "20분 연장" : "연장 사용 완료"}
          </button>
          <button
            type="button"
            className="pixel-button violet flex items-center justify-center gap-2"
            disabled={busy}
            onClick={onGiveUp}
          >
            <Flag aria-hidden="true" size={19} />
            {givingUp ? "처리 중" : "포기"}
          </button>
        </div>
      </section>
    </dialog>
  );
}
