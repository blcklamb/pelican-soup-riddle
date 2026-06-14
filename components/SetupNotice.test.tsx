import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SetupNotice } from "@/components/SetupNotice";

describe("SetupNotice", () => {
  it("lists missing environment variables", () => {
    render(<SetupNotice missing={["OPENAI_API_KEY", "SUPABASE_SERVICE_ROLE_KEY"]} />);
    expect(screen.getByText("서비스 연결이 필요합니다")).toBeInTheDocument();
    expect(screen.getByText("OPENAI_API_KEY")).toBeInTheDocument();
    expect(screen.getByText("SUPABASE_SERVICE_ROLE_KEY")).toBeInTheDocument();
  });
});
