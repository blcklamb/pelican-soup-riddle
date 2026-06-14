import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatBubble, TypingBubble } from "@/components/ChatBubble";

describe("ChatBubble", () => {
  it("renders a user question", () => {
    render(<ChatBubble message={{ id: "1", role: "user", content: "밤이었나요?", createdAt: "2026-06-14T00:00:00Z" }} />);
    expect(screen.getByText("밤이었나요?")).toBeInTheDocument();
  });

  it("announces the assistant loading state", () => {
    render(<TypingBubble />);
    expect(screen.getByLabelText("AI 답변 생성 중")).toBeInTheDocument();
  });
});
