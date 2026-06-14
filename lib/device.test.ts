import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDeviceId, getOrCreateDeviceId } from "@/lib/device";

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("createDeviceId", () => {
  it("uses randomUUID when the browser supports it", () => {
    const randomUUID = vi.fn(() => "native-uuid");

    expect(createDeviceId({ randomUUID })).toBe("native-uuid");
    expect(randomUUID).toHaveBeenCalledOnce();
  });

  it("creates a UUID v4 with getRandomValues when randomUUID is unavailable", () => {
    const getRandomValues = vi.fn((values: Uint8Array) => {
      values.fill(0xab);
      return values;
    });

    const deviceId = createDeviceId({ getRandomValues });

    expect(deviceId).toMatch(UUID_V4_PATTERN);
    expect(deviceId).toBe("abababab-abab-4bab-abab-abababababab");
  });

  it("creates a UUID v4 when the Web Crypto API is unavailable", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    expect(createDeviceId(undefined)).toMatch(UUID_V4_PATTERN);
  });
});

describe("getOrCreateDeviceId", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns the existing device ID", () => {
    window.localStorage.setItem("turtle_soup_device_id", "existing-device-id");

    expect(getOrCreateDeviceId()).toBe("existing-device-id");
  });

  it("stores a generated device ID", () => {
    const deviceId = getOrCreateDeviceId();

    expect(deviceId).toMatch(UUID_V4_PATTERN);
    expect(window.localStorage.getItem("turtle_soup_device_id")).toBe(deviceId);
  });
});
