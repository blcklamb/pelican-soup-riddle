import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionTimeoutDialog } from "@/components/SessionTimeoutDialog";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
});

describe("SessionTimeoutDialog", () => {
  it("offers extension and give-up actions after 20 minutes", () => {
    const onExtend = vi.fn();
    const onGiveUp = vi.fn();
    render(
      <SessionTimeoutDialog
        open
        extending={false}
        givingUp={false}
        onExtend={onExtend}
        onGiveUp={onGiveUp}
      />,
    );

    expect(screen.getByText("20분이 지났습니다")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "20분 연장" }));
    fireEvent.click(screen.getByRole("button", { name: "포기" }));
    expect(onExtend).toHaveBeenCalledOnce();
    expect(onGiveUp).toHaveBeenCalledOnce();
  });

  it("locks both choices while a request is pending", () => {
    render(
      <SessionTimeoutDialog
        open
        extending
        givingUp={false}
        onExtend={vi.fn()}
        onGiveUp={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "연장 중" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "포기" })).toBeDisabled();
  });
});
