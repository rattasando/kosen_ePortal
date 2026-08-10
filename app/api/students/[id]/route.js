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

const STUDENT_FIELDS = [
  "prefix","prefixEn","name","nameEn","lastname","lastnameEn","nickname","gender","dob",
  "nationalId","passport","militaryStatus","tel","email","lineId","country",
  "addrThHouseNo","addrThSubdistrict","addrThDistrict","addrThProvince","addrThPostalCode",
  "addrJpPostalCode","addrJpPrefecture","addrJpCity","addrJpStreetAddress","addrJpBuilding",
  "prevSchool","scholarship","scholarshipTypeId",
  "bankName","bankBranch","bankAccountNo",
  "departureDateTh","arrivalDateJp","status","note","avatar","createdBy",
];

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { enrollments } = body;

    const data = Object.fromEntries(
      STUDENT_FIELDS.filter((k) => k in body).map((k) => [k, body[k]])
    );

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
            ? { create: enrollments.map(({ id: _id, studentId: _sid, ...e }) => e) }
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
