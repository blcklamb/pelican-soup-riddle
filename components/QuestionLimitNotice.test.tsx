import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuestionLimitNotice } from "@/components/QuestionLimitNotice";

describe("QuestionLimitNotice", () => {
  it("directs the player to answer or give up", () => {
    render(<QuestionLimitNotice />);
    expect(screen.getByText("질문 30개를 모두 사용했습니다")).toBeInTheDocument();
    expect(
      screen.getByText("더 이상 질문할 수 없습니다. 정답을 제출하거나 포기해주세요."),
    ).toBeInTheDocument();
    expect(screen.getByText("정답 제출")).toBeInTheDocument();
    expect(screen.getByText("포기")).toBeInTheDocument();
  });
});
