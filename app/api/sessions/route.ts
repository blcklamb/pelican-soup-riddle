import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { mapSession } from "@/lib/mappers";
import { createSessionSchema, deviceIdSchema } from "@/lib/schemas";
import { sessionSelect } from "@/lib/game-service";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const input = createSessionSchema.parse(await request.json());
    const supabase = createServiceClient();
    const existing = await supabase
      .from("game_sessions")
      .select(sessionSelect)
      .eq("device_id", input.deviceId)
      .eq("problem_id", input.problemId)
      .eq("status", "in_progress")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) {
      return NextResponse.json(mapSession(existing.data as unknown as Record<string, unknown>));
    }

    const created = await supabase
      .from("game_sessions")
      .insert({ device_id: input.deviceId, problem_id: input.problemId })
      .select(sessionSelect)
      .single();
    if (created.error) throw created.error;
    return NextResponse.json(mapSession(created.data as unknown as Record<string, unknown>), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const deviceId = deviceIdSchema.parse(request.nextUrl.searchParams.get("deviceId"));
    const { data, error } = await createServiceClient()
      .from("game_sessions")
      .select(sessionSelect)
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json((data ?? []).map((row) => mapSession(row as unknown as Record<string, unknown>, true)));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
