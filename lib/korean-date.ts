const KOREAN_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getKoreanDate(date = new Date()) {
  const parts = KOREAN_DATE_FORMATTER.formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

export function addCalendarDays(date: string, days: number) {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) throw new Error("유효하지 않은 날짜입니다.");
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export function getCalendarDateRange(startDate: string, days: number) {
  return Array.from({ length: Math.max(0, days) }, (_, index) =>
    addCalendarDays(startDate, index),
  );
}
