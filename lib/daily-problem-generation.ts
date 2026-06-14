import { generateReviewedProblem } from "@/lib/openai";
import {
  addCalendarDays,
  getCalendarDateRange,
  getKoreanDate,
} from "@/lib/korean-date";
import { createServiceClient } from "@/lib/supabase";

export const SCHEDULE_HORIZON_DAYS = 28;
const GENERATION_CONCURRENCY = 3;

export type GeneratedDateResult =
  | {
      status: "generated";
      targetDate: string;
      problemId: string;
      title: string;
      attempts: number;
      reviewScore: number;
    }
  | { status: "running"; targetDate: string }
  | { status: "failed"; targetDate: string; error: string };

export interface ScheduleGenerationResult {
  requested: number;
  generated: number;
  running: number;
  failed: number;
  results: GeneratedDateResult[];
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function chooseGenerationTarget(
  today: string,
  scheduledDates: string[],
) {
  const tomorrow = addCalendarDays(today, 1);
  const scheduled = new Set(scheduledDates);
  if (!scheduled.has(today)) return today;
  if (!scheduled.has(tomorrow)) return tomorrow;
  return null;
}

export function getMissingScheduleDates(
  startDate: string,
  days: number,
  scheduledDates: string[],
) {
  const scheduled = new Set(scheduledDates);
  return getCalendarDateRange(startDate, days).filter(
    (date) => !scheduled.has(date),
  );
}

async function markStaleRunFailed(targetDate: string, now: Date) {
  const staleBefore = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const { error } = await createServiceClient()
    .from("problem_generation_runs")
    .update({
      status: "failed",
      message: "실행 시간이 15분을 초과하여 자동 종료되었습니다.",
      completed_at: now.toISOString(),
    })
    .eq("target_date", targetDate)
    .eq("status", "running")
    .lt("started_at", staleBefore);
  if (error) throw error;
}

export async function generateProblemForDate(
  targetDate: string,
  now = new Date(),
): Promise<GeneratedDateResult> {
  const supabase = createServiceClient();
  const today = getKoreanDate(now);
  await markStaleRunFailed(targetDate, now);

  const runResult = await supabase
    .from("problem_generation_runs")
    .insert({ target_date: targetDate, status: "running" })
    .select("id")
    .single();
  if (runResult.error?.code === "23505") {
    return { status: "running", targetDate };
  }
  if (runResult.error) throw runResult.error;
  const runId = String(runResult.data.id);

  try {
    const existingResult = await supabase
      .from("problems")
      .select("title, question")
      .order("created_at", { ascending: false })
      .limit(300);
    if (existingResult.error) throw existingResult.error;

    const generated = await generateReviewedProblem({
      existingProblems: (existingResult.data ?? []).map((problem) => ({
        title: String(problem.title),
        question: String(problem.question),
      })),
      maxAttempts: 3,
    });
    const candidate = generated.candidate;
    const publishResult = await supabase.rpc("publish_generated_daily_problem", {
      p_release_date: targetDate,
      p_title: candidate.title,
      p_question: candidate.question,
      p_answer: candidate.answer,
      p_explanation: candidate.explanation,
      p_answer_keywords: candidate.answerKeywords,
      p_category: candidate.category,
      p_difficulty: candidate.difficulty,
      p_is_released: targetDate <= today,
    });
    if (publishResult.error) throw publishResult.error;
    const problemId = String(publishResult.data);

    const completedResult = await supabase
      .from("problem_generation_runs")
      .update({
        status: "completed",
        attempts: generated.attempts,
        problem_id: problemId,
        review_score: generated.review.score,
        message: generated.review.summary,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);
    if (completedResult.error) console.error(completedResult.error);

    return {
      status: "generated",
      targetDate,
      problemId,
      title: candidate.title,
      attempts: generated.attempts,
      reviewScore: generated.review.score,
    };
  } catch (error) {
    const message = errorMessage(error);
    const failedResult = await supabase
      .from("problem_generation_runs")
      .update({
        status: "failed",
        message: message.slice(0, 1000),
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);
    if (failedResult.error) console.error(failedResult.error);
    return { status: "failed", targetDate, error: message };
  }
}

export async function fillProblemSchedule(input?: {
  startDate?: string;
  days?: number;
  maxGenerate?: number;
  now?: Date;
}): Promise<ScheduleGenerationResult> {
  const now = input?.now ?? new Date();
  const startDate = input?.startDate ?? getKoreanDate(now);
  const days = Math.max(1, Math.min(input?.days ?? SCHEDULE_HORIZON_DAYS, 35));
  const maxGenerate = Math.max(1, Math.min(input?.maxGenerate ?? days, days));
  const endDate = addCalendarDays(startDate, days - 1);
  const scheduleResult = await createServiceClient()
    .from("daily_releases")
    .select("release_date")
    .gte("release_date", startDate)
    .lte("release_date", endDate);
  if (scheduleResult.error) throw scheduleResult.error;

  const missingDates = getMissingScheduleDates(
    startDate,
    days,
    (scheduleResult.data ?? []).map((row) => String(row.release_date)),
  ).slice(0, maxGenerate);
  const results: GeneratedDateResult[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < missingDates.length) {
      const targetDate = missingDates[nextIndex];
      nextIndex += 1;
      results.push(await generateProblemForDate(targetDate, now));
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(GENERATION_CONCURRENCY, missingDates.length) },
      () => worker(),
    ),
  );
  results.sort((a, b) => a.targetDate.localeCompare(b.targetDate));

  return {
    requested: missingDates.length,
    generated: results.filter((result) => result.status === "generated").length,
    running: results.filter((result) => result.status === "running").length,
    failed: results.filter((result) => result.status === "failed").length,
    results,
  };
}

export async function releaseDailyProblem(now = new Date()) {
  const releaseDate = getKoreanDate(now);
  const result = await createServiceClient().rpc(
    "release_scheduled_daily_problem",
    { p_release_date: releaseDate },
  );
  if (result.error) throw result.error;
  return { releaseDate, released: Number(result.data ?? 0) };
}

export async function ensureDailyProblem(now = new Date()) {
  const release = await releaseDailyProblem(now);
  const schedule = await fillProblemSchedule({
    startDate: getKoreanDate(now),
    days: 2,
    maxGenerate: 1,
    now,
  });
  return { release, schedule };
}
