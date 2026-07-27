import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_, { params }) {
  const { id } = await params;
  const news = await prisma.news.findUnique({
    where: { id },
    include: { blocks: { orderBy: { order: "asc" } } },
  });
  if (!news) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(news);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const { blocks, ...data } = await request.json();

  // Replace all blocks (delete + recreate)
  const news = await prisma.$transaction(async (tx) => {
    await tx.newsBlock.deleteMany({ where: { newsId: id } });
    return tx.news.update({
      where: { id },
      data: {
        ...data,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        blocks: blocks?.length
          ? { create: blocks.map(({ id: _id, ...b }) => b) }
          : undefined,
      },
      include: { blocks: { orderBy: { order: "asc" } } },
    });
  });
  return NextResponse.json(news);
}

export async function DELETE(_, { params }) {
  const { id } = await params;
  await prisma.news.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
