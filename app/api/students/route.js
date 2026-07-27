import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where = {};
  if (status) where.status = status;

  const students = await prisma.student.findMany({
    where,
    orderBy: { id: "asc" },
    include: { enrollments: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(students);
}

export async function POST(request) {
  const { enrollments, ...data } = await request.json();

  const student = await prisma.student.create({
    data: {
      ...data,
      dob: data.dob ? new Date(data.dob) : null,
      departureDateTh: data.departureDateTh ? new Date(data.departureDateTh) : null,
      arrivalDateJp: data.arrivalDateJp ? new Date(data.arrivalDateJp) : null,
      enrollments: enrollments?.length
        ? { create: enrollments }
        : undefined,
    },
    include: { enrollments: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(student, { status: 201 });
}
