"use client";

import { useSyncExternalStore } from "react";
import { getOrCreateDeviceId } from "@/lib/device";

export function useDeviceId() {
  return useSyncExternalStore(
    () => () => undefined,
    getOrCreateDeviceId,
    () => null,
  );
}
