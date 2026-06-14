import { CircleHelp, Flag, Lightbulb } from "lucide-react";
import { MAX_QUESTIONS_PER_SESSION } from "@/lib/game-policy";

export function QuestionLimitNotice() {
  return (
    <aside className="mb-3 rounded-lg border border-[#35280e] bg-[#1c1709] p-4 text-center">
      <CircleHelp
        className="mx-auto mb-2 text-[#b89040]"
        aria-hidden="true"
        size={24}
      />
      <p className="text-sm font-semibold text-[#b89040]">
        질문 {MAX_QUESTIONS_PER_SESSION}개를 모두 사용했습니다
      </p>
      <p className="muted mt-1 text-xs leading-5">
        더 이상 질문할 수 없습니다. 정답을 제출하거나 포기해주세요.
      </p>
      <div className="mt-3 flex justify-center gap-4 text-xs text-[#62627a]">
        <span className="flex items-center gap-1">
          <Lightbulb aria-hidden="true" size={13} /> 정답 제출
        </span>
        <span className="flex items-center gap-1">
          <Flag aria-hidden="true" size={13} /> 포기
        </span>
      </div>
    </aside>
  );
}
