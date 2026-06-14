import { NextResponse } from "next/server";
import { getMissingEnvKeys } from "@/lib/env";

export async function GET() {
  const missing = getMissingEnvKeys();
  return NextResponse.json({ configured: missing.length === 0, missing });
}
