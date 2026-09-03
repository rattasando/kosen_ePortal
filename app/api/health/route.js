import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Health check failed:", err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 503 });
  }
}
