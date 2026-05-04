import { type NextRequest, NextResponse } from "next/server";
import { BACKEND } from "@/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(BACKEND.RISK.LIST);
    const data: unknown = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const res = await fetch(BACKEND.RISK.SUBMIT_CSV, {
      method: "POST",
      body: formData,
    });
    const data: unknown = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }
}
