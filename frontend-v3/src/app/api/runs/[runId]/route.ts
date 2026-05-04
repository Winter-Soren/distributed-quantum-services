import { BACKEND } from "@/constants";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  const res = await fetch(BACKEND.JOBS.DETAIL(runId));
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
