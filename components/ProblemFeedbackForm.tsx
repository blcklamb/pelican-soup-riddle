"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client-api";
import { useDeviceId } from "@/lib/use-device-id";

const ratingOptions = [1, 2, 3, 4, 5];

export function ProblemFeedbackForm({ sessionId }: { sessionId: string }) {
  const deviceId = useDeviceId();
  const [funRating, setFunRating] = useState(3);
  const [difficultyRating, setDifficultyRating] = useState(3);
  const [fairnessRating, setFairnessRating] = useState(3);
  const [reportReason, setReportReason] = useState("");
  const [comment, setComment] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          deviceId,
          sessionId,
          funRating,
          difficultyRating,
          fairnessRating,
          reportReason: reportReason || undefined,
          comment: comment.trim() || undefined,
        }),
      }),
  });

  if (mutation.isSuccess) {
    return <p className="mt-5 border-t border-white/10 pt-5 text-center text-sm text-[#7aaa6a]">평가가 저장되었습니다.</p>;
  }

  return (
    <form className="mt-5 space-y-3 border-t border-white/10 pt-5" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
      <h3 className="text-sm font-bold">문제 평가</h3>
      {[
        ["재미", funRating, setFunRating],
        ["난이도 적절성", difficultyRating, setDifficultyRating],
        ["정답 타당성", fairnessRating, setFairnessRating],
      ].map(([label, value, setter]) => (
        <label key={String(label)} className="flex items-center justify-between gap-3 text-xs">
          <span className="muted">{String(label)}</span>
          <select value={Number(value)} onChange={(event) => (setter as (value: number) => void)(Number(event.target.value))} className="rounded border border-[#22222e] bg-[#0e0e14] px-2 py-1">
            {ratingOptions.map((rating) => <option key={rating} value={rating}>{rating}점</option>)}
          </select>
        </label>
      ))}
      <select aria-label="신고 사유" value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="min-h-10 w-full rounded border border-[#22222e] bg-[#0e0e14] px-2 text-xs">
        <option value="">신고하지 않음</option>
        <option value="incorrect_answer">정답 오류</option><option value="ambiguous">문제가 모호함</option><option value="offensive">불쾌한 내용</option><option value="copyright">저작권 우려</option>
      </select>
      <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} rows={2} placeholder="선택 의견" className="w-full resize-none rounded border border-[#22222e] bg-[#0e0e14] p-2 text-xs" />
      {mutation.isError ? <p className="error-text text-xs">{mutation.error.message}</p> : null}
      <button className="pixel-button ghost w-full text-sm" type="submit" disabled={mutation.isPending || !deviceId}>{mutation.isPending ? "저장 중..." : "평가 저장"}</button>
    </form>
  );
}
