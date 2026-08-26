import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/utils/apiHandler";

export const GET = withErrorHandler(async (_, { params }) => {
  const { id } = await params;
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: { blocks: { orderBy: { order: "asc" } } },
  });
  if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(activity);
}, "GET /api/activities/[id]");

export const PUT = withErrorHandler(async (request, { params }) => {
  const { id } = await params;
  const { blocks, ...data } = await request.json();

  const activity = await prisma.$transaction(async (tx) => {
    await tx.activityBlock.deleteMany({ where: { activityId: id } });
    return tx.activity.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : null,
        blocks: blocks?.length
          ? { create: blocks.map(({ id: _id, ...b }) => b) }
          : undefined,
      },
      include: { blocks: { orderBy: { order: "asc" } } },
    });
  });
  return NextResponse.json(activity);
}, "PUT /api/activities/[id]");

export const DELETE = withErrorHandler(async (_, { params }) => {
  const { id } = await params;
  await prisma.activity.delete({ where: { id } });
  return NextResponse.json({ success: true });
}, "DELETE /api/activities/[id]");
