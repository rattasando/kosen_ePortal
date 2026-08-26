import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/utils/apiHandler";

const blockId = () => `B${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.slice(0, 20);
const prepBlocks = (blocks) =>
  blocks.map(({ id: _id, newsId: _nid, ...b }) => ({ ...b, id: blockId() }));

export const GET = withErrorHandler(async (_, { params }) => {
  const { id } = await params;
  const news = await prisma.news.findUnique({
    where: { id },
    include: { blocks: { orderBy: { order: "asc" } } },
  });
  if (!news) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(news);
}, "GET /api/news/[id]");

const NEWS_FIELDS = [
  "title", "slug", "category", "catColor", "excerpt", "image",
  "authorId", "authorName", "tags", "status", "featured",
  "publishedAt", "heroAspect", "imagePosition", "views",
];

function prepNewsData(rawData) {
  const { author, blocks: _b, createdAt: _ca, updatedAt: _ua, ...rest } = rawData;
  const data = Object.fromEntries(
    NEWS_FIELDS.filter((k) => k in rest).map((k) => [k, rest[k]])
  );
  if (author !== undefined) data.authorName = author;
  return data;
}

export const PUT = withErrorHandler(async (request, { params }) => {
  const { id } = await params;
  const { blocks, ...rawData } = await request.json();
  const data = prepNewsData(rawData);

  // Replace all blocks (delete + recreate)
  const news = await prisma.$transaction(async (tx) => {
    await tx.newsBlock.deleteMany({ where: { newsId: id } });
    return tx.news.update({
      where: { id },
      data: {
        ...data,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        blocks: blocks?.length
          ? { create: prepBlocks(blocks) }
          : undefined,
      },
      include: { blocks: { orderBy: { order: "asc" } } },
    });
  });
  return NextResponse.json(news);
}, "PUT /api/news/[id]");

export const DELETE = withErrorHandler(async (_, { params }) => {
  const { id } = await params;
  await prisma.news.delete({ where: { id } });
  return NextResponse.json({ success: true });
}, "DELETE /api/news/[id]");
