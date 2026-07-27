import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_, { params }) {
  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: { enrollments: { orderBy: { order: "asc" } } },
  });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(student);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const { enrollments, ...data } = await request.json();

  const student = await prisma.$transaction(async (tx) => {
    if (enrollments !== undefined) {
      await tx.studentEnrollment.deleteMany({ where: { studentId: id } });
    }
    return tx.student.update({
      where: { id },
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
  });
  return NextResponse.json(student);
}

export async function DELETE(_, { params }) {
  const { id } = await params;
  await prisma.student.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
