"use client";

import { useSyncExternalStore } from "react";
import { getOrCreateDeviceId } from "@/lib/device";

const subscribe = () => () => undefined;
const getServerSnapshot = () => null;

export function useDeviceId() {
  return useSyncExternalStore(
    subscribe,
    getOrCreateDeviceId,
    getServerSnapshot,
  );
}
