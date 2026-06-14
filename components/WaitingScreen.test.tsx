import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { formatWaitTime, WaitingScreen } from "@/components/WaitingScreen";
import { apiFetch } from "@/lib/client-api";

vi.mock("@/lib/client-api", () => ({ apiFetch: vi.fn() }));

afterEach(() => {
  vi.useRealTimers();
  vi.mocked(apiFetch).mockReset();
});

describe("WaitingScreen", () => {
  it("shows the current queue estimate", () => {
    render(
      <WaitingScreen
        deviceId="00000000-0000-4000-8000-000000000000"
        position={5}
        estimatedWaitSeconds={150}
        onReady={vi.fn()}
      />,
    );

    expect(screen.getByText(/현재 대기 순번:/)).toHaveTextContent("5번");
    expect(screen.getByText(/예상 대기 시간:/)).toHaveTextContent("약 2분 30초");
  });

  it("formats short and exact-minute estimates", () => {
    expect(formatWaitTime(30)).toBe("약 30초");
    expect(formatWaitTime(120)).toBe("약 2분");
  });

  it("polls after five seconds and enters when a slot opens", async () => {
    vi.useFakeTimers();
    vi.mocked(apiFetch).mockResolvedValue({
      canEnter: true,
      position: 0,
      estimatedWaitSeconds: 0,
    });
    const onReady = vi.fn();
    render(
      <WaitingScreen
        deviceId="00000000-0000-4000-8000-000000000000"
        position={1}
        estimatedWaitSeconds={30}
        onReady={onReady}
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/api/queue?deviceId=00000000-0000-4000-8000-000000000000",
    );
    expect(onReady).toHaveBeenCalledOnce();
  });

  it("does not overlap queue checks while a request is pending", async () => {
    vi.useFakeTimers();
    let resolveRequest: ((value: {
      canEnter: boolean;
      position: number;
      estimatedWaitSeconds: number;
    }) => void) | undefined;
    vi.mocked(apiFetch).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    render(
      <WaitingScreen
        deviceId="00000000-0000-4000-8000-000000000000"
        position={2}
        estimatedWaitSeconds={60}
        onReady={vi.fn()}
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(apiFetch).toHaveBeenCalledOnce();

    await act(async () => {
      resolveRequest?.({
        canEnter: false,
        position: 1,
        estimatedWaitSeconds: 30,
      });
      await Promise.resolve();
    });
  });
});
