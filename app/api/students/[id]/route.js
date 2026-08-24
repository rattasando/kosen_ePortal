import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  STUDENT_VARCHAR_LIMITS,
  ENROLLMENT_VARCHAR_LIMITS,
  findTooLongFields,
  describeTooLongFields,
} from "@/lib/utils/studentFieldLimits";
import { prepEnrollments } from "@/lib/utils/studentEnrollments";

export async function GET(_, { params }) {
  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: { enrollments: { orderBy: { order: "asc" } } },
  });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(student);
}

const STUDENT_FIELDS = [
  "prefix","prefixEn","name","nameEn","lastname","lastnameEn","nickname","gender","dob",
  "nationalId","passport","militaryStatus","tel","email","lineId","country",
  "addrThHouseNo","addrThSubdistrict","addrThDistrict","addrThProvince","addrThPostalCode",
  "addrJpPostalCode","addrJpPrefecture","addrJpCity","addrJpStreetAddress","addrJpBuilding",
  "prevSchool","scholarship","selfFunded","scholarshipTypeId",
  "bankName","bankBranch","bankAccountNo",
  "departureDateTh","arrivalDateJp","status","note","avatar","createdBy",
];

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { enrollments, updatedAt: clientUpdatedAt } = body;

    // Optimistic locking — ป้องกัน 2 คนแก้ข้อมูลเดียวกันพร้อมกัน
    // ถ้า client ส่ง updatedAt มาด้วย ให้เช็คก่อนว่า record ไม่ได้ถูกแก้ไปแล้วตั้งแต่เปิดหน้า
    if (clientUpdatedAt) {
      const current = await prisma.student.findUnique({ where: { id }, select: { updatedAt: true } });
      if (current && current.updatedAt.toISOString() !== new Date(clientUpdatedAt).toISOString()) {
        return NextResponse.json(
          { error: "ข้อมูลนี้ถูกแก้ไขโดยผู้ใช้อื่นไปแล้ว กรุณารีโหลดหน้าและลองใหม่อีกครั้ง" },
          { status: 409 }
        );
      }
    }

    const data = Object.fromEntries(
      STUDENT_FIELDS.filter((k) => k in body).map((k) => [k, body[k]])
    );

    const tooLong = [
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
        { error: `ข้อมูลนักเรียน ${id}: มีข้อความยาวเกินกำหนด — ${describeTooLongFields(tooLong)}` },
        { status: 400 }
      );
    }

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
            ? { create: prepEnrollments(enrollments) }
            : undefined,
        },
        include: { enrollments: { orderBy: { order: "asc" } } },
      });
    });
    return NextResponse.json(student);
  } catch (err) {
    console.error("PUT /api/students/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  const { id } = await params;
  await prisma.student.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
