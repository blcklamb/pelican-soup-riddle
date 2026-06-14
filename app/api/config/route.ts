import { NextResponse } from "next/server";
import { handleApiRequest } from "@/lib/api";
import { getMissingEnvKeys } from "@/lib/env";

export async function GET(request: Request) {
  return handleApiRequest(request, "/api/config", async () => {
    const missing = getMissingEnvKeys();
    return NextResponse.json({ configured: missing.length === 0, missing });
  });
}
