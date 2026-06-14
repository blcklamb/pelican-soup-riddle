export function getAvailableHintLevel(
  questionCount: number,
  hintCount: number,
  hasHint1 = true,
  hasHint2 = true,
): 1 | 2 | null {
  if (hintCount === 0 && questionCount >= 10 && hasHint1) return 1;
  if (hintCount === 1 && questionCount >= 20 && hasHint2) return 2;
  return null;
}
