import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/utils/apiHandler";

/** Generate block id ขนาด ≤ 20 ตัวอักษร (VarChar 20) */
const blockId = () => `B${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.slice(0, 20);

/** Prepare blocks สำหรับ Prisma create — strip id เดิม แล้ว generate ใหม่ */
const prepBlocks = (blocks) =>
  blocks.map(({ id: _id, newsId: _nid, ...b }) => ({ ...b, id: blockId() }));

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

/**
 * fields ที่ Prisma รับโดยตรงสำหรับ news.create/update
 * - strip author (relation), createdAt, updatedAt (auto-managed), blocks (handled separately)
 * - map author (string จาก form) → authorName
 */
const NEWS_FIELDS = [
  "id", "title", "slug", "category", "catColor", "excerpt", "image",
  "authorId", "authorName", "tags", "status", "featured",
  "publishedAt", "heroAspect", "imagePosition", "views",
];

function prepNewsData(rawData) {
  const { author, blocks: _blocks, createdAt: _ca, updatedAt: _ua, ...rest } = rawData;
  const data = Object.fromEntries(
    NEWS_FIELDS.filter((k) => k in rest).map((k) => [k, rest[k]])
  );
  if (author !== undefined) data.authorName = author;
  return data;
}

export const POST = withErrorHandler(async (request) => {
  const { blocks, ...rawData } = await request.json();
  const data = prepNewsData(rawData);

  const news = await prisma.news.create({
    data: {
      ...data,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      blocks: blocks?.length
        ? { create: prepBlocks(blocks) }
        : undefined,
    },
    include: { blocks: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(news, { status: 201 });
}, "POST /api/news");
