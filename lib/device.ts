const DEVICE_KEY = "turtle_soup_device_id";

export function getOrCreateDeviceId(): string {
  const stored = window.localStorage.getItem(DEVICE_KEY);
  if (stored) return stored;

  const deviceId = window.crypto.randomUUID();
  window.localStorage.setItem(DEVICE_KEY, deviceId);
  return deviceId;
}
