import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, latency: Date.now() - start });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 503 });
  }
}
