import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const alumni = await prisma.alumni.findMany({
    orderBy: { graduatedYear: "desc" },
    include: { employmentHistory: true },
  });
  return NextResponse.json(alumni);
}

export async function POST(request) {
  const { employmentHistory, ...data } = await request.json();
  const alumni = await prisma.alumni.create({
    data: {
      ...data,
      employmentHistory: employmentHistory?.length
        ? { create: employmentHistory }
        : undefined,
    },
    include: { employmentHistory: true },
  });
  return NextResponse.json(alumni, { status: 201 });
}
