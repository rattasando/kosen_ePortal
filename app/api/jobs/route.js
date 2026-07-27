import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where = {};
  if (status) where.status = status;

  const jobs = await prisma.job.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { company: { select: { id: true, name: true } } },
  });
  return NextResponse.json(jobs);
}

export async function POST(request) {
  const data = await request.json();
  const job = await prisma.job.create({
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : null,
      deadline: data.deadline ? new Date(data.deadline) : null,
    },
  });
  return NextResponse.json(job, { status: 201 });
}
