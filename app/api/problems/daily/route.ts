import { NextResponse } from "next/server";
import { ApiError, handleApiRequest } from "@/lib/api";
import { getKoreanDate } from "@/lib/korean-date";
import { mapPublicProblem } from "@/lib/mappers";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: Request) {
  return handleApiRequest(request, "/api/problems/daily", async () => {
    const today = getKoreanDate();
    const { data, error } = await createServiceClient()
      .from("daily_releases")
      .select("release_date, problem:problems!inner(id, title, question, category, difficulty, created_at)")
      .eq("is_released", true)
      .neq("problem.moderation_status", "suspended")
      .lte("release_date", today)
      .order("release_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new ApiError("공개된 문제가 아직 없습니다.", 404);
    const problem = Array.isArray(data.problem) ? data.problem[0] : data.problem;
    return NextResponse.json(mapPublicProblem(problem as unknown as Record<string, unknown>, data.release_date));
  });
}
