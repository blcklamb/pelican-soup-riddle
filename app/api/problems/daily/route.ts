import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api";
import { mapPublicProblem } from "@/lib/mappers";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await createServiceClient()
      .from("daily_releases")
      .select("release_date, problem:problems(id, title, question, category, difficulty, created_at)")
      .eq("is_released", true)
      .lte("release_date", today)
      .order("release_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new ApiError("공개된 문제가 아직 없습니다.", 404);
    const problem = Array.isArray(data.problem) ? data.problem[0] : data.problem;
    return NextResponse.json(mapPublicProblem(problem as unknown as Record<string, unknown>, data.release_date));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
