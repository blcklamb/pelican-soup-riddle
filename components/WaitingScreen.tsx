"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { PixelPanel } from "@/components/PixelPanel";
import { apiFetch } from "@/lib/client-api";

type QueueStatus = {
  canEnter: boolean;
  position: number;
  estimatedWaitSeconds: number;
};

interface WaitingScreenProps {
  deviceId: string;
  position: number;
  estimatedWaitSeconds: number;
  onReady: () => void;
}

function formatWaitTime(seconds: number) {
  if (seconds < 60) return `약 ${seconds}초`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds
    ? `약 ${minutes}분 ${remainingSeconds}초`
    : `약 ${minutes}분`;
}

export function WaitingScreen({
  deviceId,
  position: initialPosition,
  estimatedWaitSeconds: initialWaitSeconds,
  onReady,
}: WaitingScreenProps) {
  const [status, setStatus] = useState<QueueStatus>({
    canEnter: false,
    position: initialPosition,
    estimatedWaitSeconds: initialWaitSeconds,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const requestInFlightRef = useRef(false);
  const readyRef = useRef(false);

  const checkQueue = useCallback(async () => {
    if (requestInFlightRef.current || readyRef.current) return;
    requestInFlightRef.current = true;
    setLoading(true);
    try {
      const next = await apiFetch<QueueStatus>(
        `/api/queue?deviceId=${encodeURIComponent(deviceId)}`,
      );
      setStatus(next);
      setError(undefined);
      if (next.canEnter) {
        readyRef.current = true;
        onReady();
      }
    } catch (queueError) {
      setError(
        queueError instanceof Error
          ? queueError.message
          : "대기 상태를 확인하지 못했습니다.",
      );
    } finally {
      requestInFlightRef.current = false;
      setLoading(false);
    }
  }, [deviceId, onReady]);

  useEffect(() => {
    const timer = window.setInterval(checkQueue, 5_000);
    return () => window.clearInterval(timer);
  }, [checkQueue]);

  return (
    <main className="app-shell">
      <AppHeader />
      <PixelPanel title="대기실" className="p-7 pt-9 text-center">
        <h1 className="text-xl font-semibold text-[#deded8]">
          잠시 기다려 주세요
        </h1>
        <p className="muted mt-3 text-sm leading-6">
          현재 게임을 이용 중인 사용자가 많습니다.
          <br />자리가 생기면 자동으로 게임을 시작합니다.
        </p>
        <div className="my-8 space-y-2 rounded-lg border border-[#22222e] bg-[#0e0e14] p-5">
          <p className="text-sm text-[#c0c0d0]">
            현재 대기 순번: <strong>{status.position}번</strong>
          </p>
          <p className="text-sm text-[#c0c0d0]">
            예상 대기 시간: {formatWaitTime(status.estimatedWaitSeconds)}
          </p>
        </div>
        <button
          type="button"
          className="pixel-button ghost flex w-full items-center justify-center gap-2"
          disabled={loading}
          onClick={checkQueue}
        >
          <RefreshCw aria-hidden="true" size={17} />
          {loading ? "확인 중..." : "새로 고침"}
        </button>
        {error ? <p className="error-text mt-3 text-xs">{error}</p> : null}
      </PixelPanel>
    </main>
  );
}

export { formatWaitTime };
