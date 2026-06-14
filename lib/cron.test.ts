import { afterEach, describe, expect, it } from "vitest";
import { assertCronAuthorized } from "@/lib/cron";

describe("cron authorization", () => {
  const previousSecret = process.env.CRON_SECRET;

  afterEach(() => {
    process.env.CRON_SECRET = previousSecret;
  });

  it("accepts the configured bearer token", () => {
    process.env.CRON_SECRET = "test-secret-at-least-16";
    const request = new Request("https://example.com/api/cron", {
      headers: { authorization: "Bearer test-secret-at-least-16" },
    });
    expect(() => assertCronAuthorized(request)).not.toThrow();
  });

  it("rejects an invalid bearer token", () => {
    process.env.CRON_SECRET = "test-secret-at-least-16";
    const request = new Request("https://example.com/api/cron", {
      headers: { authorization: "Bearer wrong" },
    });
    expect(() => assertCronAuthorized(request)).toThrow("Cron 인증");
  });
});
