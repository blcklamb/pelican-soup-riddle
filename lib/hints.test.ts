import { describe, expect, it } from "vitest";
import { getAvailableHintLevel } from "@/lib/hints";

describe("hint availability", () => {
  it("unlocks hints at 10 and 20 counted questions", () => {
    expect(getAvailableHintLevel(9, 0)).toBeNull();
    expect(getAvailableHintLevel(10, 0)).toBe(1);
    expect(getAvailableHintLevel(19, 1)).toBeNull();
    expect(getAvailableHintLevel(20, 1)).toBe(2);
  });

  it("does not offer missing or already used hints", () => {
    expect(getAvailableHintLevel(10, 0, false, true)).toBeNull();
    expect(getAvailableHintLevel(30, 2)).toBeNull();
  });
});
