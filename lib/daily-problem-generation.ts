import { generateReviewedProblem } from "@/lib/openai";
import { addCalendarDays, getKoreanDate } from "@/lib/korean-date";
import { createServiceClient } from "@/lib/supabase";

export type DailyGenerationResult =
  | {
      status: "covered";
      coveredDates: string[];
    }
  | {
      status: "running";
      targetDate: string;
    }
  | {
      status: "generated";
      targetDate: string;
      problemId: string;
      title: string;
      attempts: number;
      reviewScore: number;
    };

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

export async function ensureDailyProblem(now = new Date()): Promise<DailyGenerationResult> {
  const supabase = createServiceClient();
  const today = getKoreanDate(now);
  const tomorrow = addCalendarDays(today, 1);

  const releaseResult = await supabase
    .from("daily_releases")
    .select("release_date")
    .in("release_date", [today, tomorrow]);
  if (releaseResult.error) throw releaseResult.error;

  const scheduledDates = (releaseResult.data ?? []).map((release) =>
    String(release.release_date),
  );
  const targetDate = chooseGenerationTarget(today, scheduledDates);
  if (!targetDate) {
    return { status: "covered", coveredDates: [today, tomorrow] };
  }

  const staleBefore = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const staleResult = await supabase
    .from("problem_generation_runs")
    .update({
      status: "failed",
      message: "실행 시간이 15분을 초과하여 자동 종료되었습니다.",
      completed_at: new Date().toISOString(),
    })
    .eq("target_date", targetDate)
    .eq("status", "running")
    .lt("started_at", staleBefore);
  if (staleResult.error) throw staleResult.error;

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
      .limit(200);
    if (existingResult.error) throw existingResult.error;

    const existingProblems = (existingResult.data ?? []).map((problem) => ({
      title: String(problem.title),
      question: String(problem.question),
    }));
    const generated = await generateReviewedProblem({
      existingProblems,
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
    const failedResult = await supabase
      .from("problem_generation_runs")
      .update({
        status: "failed",
        message: errorMessage(error).slice(0, 1000),
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);

    if (failedResult.error) console.error(failedResult.error);
    throw error;
  }
}
