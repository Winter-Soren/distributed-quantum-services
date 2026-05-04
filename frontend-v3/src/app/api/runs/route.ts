import { BACKEND } from "@/constants";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch(BACKEND.JOBS.LIST);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(BACKEND.CIRCUITS.SUBMIT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
