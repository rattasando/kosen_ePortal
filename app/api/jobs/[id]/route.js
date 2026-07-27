import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_, { params }) {
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: { company: { select: { id: true, name: true } } },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(job);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const data = await request.json();
  const job = await prisma.job.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : null,
      deadline: data.deadline ? new Date(data.deadline) : null,
    },
  });
  return NextResponse.json(job);
}

export async function DELETE(_, { params }) {
  const { id } = await params;
  await prisma.job.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
