"use client";

import { useEffect, useState } from "react";
import { getOrCreateDeviceId } from "@/lib/device";

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  return deviceId;
}
