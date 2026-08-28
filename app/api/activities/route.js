import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/utils/apiHandler";

const blockId = () =>
  `B${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.slice(0, 20);

const prepBlocks = (blocks) =>
  blocks.map(({ id: _id, activityId: _aid, ...b }) => ({ ...b, id: blockId() }));

export const GET = withErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const featured = searchParams.get("featured");

  const where = {};
  if (status) where.status = status;
  if (featured === "true") where.featured = true;

  const activities = await prisma.activity.findMany({
    where,
    orderBy: { date: "desc" },
    include: { blocks: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(activities);
}, "GET /api/activities");

export const POST = withErrorHandler(async (request) => {
  const { blocks, ...data } = await request.json();

  const activity = await prisma.activity.create({
    data: {
      ...data,
      date: data.date ? new Date(data.date) : null,
      blocks: blocks?.length
        ? { create: prepBlocks(blocks) }
        : undefined,
    },
    include: { blocks: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(activity, { status: 201 });
}, "POST /api/activities");
