import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/utils/apiHandler";

export const GET = withErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const featured = searchParams.get("featured");

  const where = {};
  if (status) where.status = status;
  if (featured === "true") where.featured = true;

  const news = await prisma.news.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    include: { blocks: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(news);
}, "GET /api/news");

export const POST = withErrorHandler(async (request) => {
  const { blocks, ...data } = await request.json();

  const news = await prisma.news.create({
    data: {
      ...data,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      blocks: blocks?.length
        ? { create: blocks.map(({ id: _id, ...b }) => b) }
        : undefined,
    },
    include: { blocks: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(news, { status: 201 });
}, "POST /api/news");
