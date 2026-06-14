import { NextResponse } from "next/server";
import { handleApiRequest } from "@/lib/api";
import { getKoreanDate } from "@/lib/korean-date";
import { mapPublicProblem } from "@/lib/mappers";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: Request) {
  return handleApiRequest(request, "/api/problems", async () => {
    const today = getKoreanDate();
    const { data, error } = await createServiceClient()
      .from("daily_releases")
      .select("release_date, problem:problems!inner(id, title, question, category, difficulty, created_at)")
      .eq("is_released", true)
      .neq("problem.moderation_status", "suspended")
      .lte("release_date", today)
      .order("release_date", { ascending: false });
    if (error) throw error;

    return NextResponse.json(
      (data ?? []).map((row) => {
        const problem = Array.isArray(row.problem) ? row.problem[0] : row.problem;
        return mapPublicProblem(problem as unknown as Record<string, unknown>, row.release_date);
      }),
    );
  });
}
