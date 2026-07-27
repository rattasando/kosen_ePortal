import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const banners = await prisma.banner.findMany({
    orderBy: { order: "asc" },
  });
  return NextResponse.json(banners);
}

export async function POST(request) {
  const data = await request.json();
  const banner = await prisma.banner.create({ data });
  return NextResponse.json(banner, { status: 201 });
}
