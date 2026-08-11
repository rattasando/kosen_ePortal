import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  STUDENT_ID_LIMIT,
  STUDENT_VARCHAR_LIMITS,
  ENROLLMENT_VARCHAR_LIMITS,
  findTooLongFields,
  describeTooLongFields,
} from "@/lib/utils/studentFieldLimits";
import { prepEnrollments } from "@/lib/utils/studentEnrollments";

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
  try {
    const { enrollments, ...data } = await request.json();

    const tooLong = [
      ...findTooLongFields({ id: data.id }, { id: STUDENT_ID_LIMIT }),
      ...findTooLongFields(data, STUDENT_VARCHAR_LIMITS),
      ...(enrollments ?? []).flatMap((e, i) =>
        findTooLongFields(e, ENROLLMENT_VARCHAR_LIMITS).map((err) => ({
          ...err,
          field: `enrollments[${i}].${err.field}`,
        }))
      ),
    ];
    if (tooLong.length > 0) {
      return NextResponse.json(
        { error: `ข้อมูลนักเรียน ${data.id ?? ""}: มีข้อความยาวเกินกำหนด — ${describeTooLongFields(tooLong)}` },
        { status: 400 }
      );
    }

    const student = await prisma.student.create({
      data: {
        ...data,
        dob: data.dob ? new Date(data.dob) : null,
        departureDateTh: data.departureDateTh ? new Date(data.departureDateTh) : null,
        arrivalDateJp: data.arrivalDateJp ? new Date(data.arrivalDateJp) : null,
        enrollments: enrollments?.length
          ? { create: prepEnrollments(enrollments) }
          : undefined,
      },
      include: { enrollments: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json(student, { status: 201 });
  } catch (err) {
    console.error("POST /api/students:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
