import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/utils/apiHandler";

export const GET = withErrorHandler(async () => {
  const banners = await prisma.banner.findMany({
    orderBy: { order: "asc" },
  });
  return NextResponse.json(banners);
}, "GET /api/banners");

export const POST = withErrorHandler(async (request) => {
  const data = await request.json();
  const banner = await prisma.banner.create({ data });
  return NextResponse.json(banner, { status: 201 });
}, "POST /api/banners");
