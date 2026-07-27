import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
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
}

export async function POST(request) {
  const { blocks, ...data } = await request.json();

  const activity = await prisma.activity.create({
    data: {
      ...data,
      date: data.date ? new Date(data.date) : null,
      blocks: blocks?.length
        ? { create: blocks.map(({ id: _id, ...b }) => b) }
        : undefined,
    },
    include: { blocks: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(activity, { status: 201 });
}
