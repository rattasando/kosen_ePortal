import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ALUMNI_VARCHAR_LIMITS,
  EMPLOYMENT_VARCHAR_LIMITS,
  findTooLongFields,
  describeTooLongFields,
} from "@/lib/utils/alumniFieldLimits";

// Fields allowed in alumni update — ป้องกัน unknown field ถึง Prisma
const ALUMNI_FIELDS = [
  "prefix", "name", "lastname", "nameEn", "lastnameEn", "nickname",
  "major", "university", "graduatedYear", "contact", "phone",
  "scholarshipTypeId", "scholarshipYears", "scholarshipStatus", "remark",
];

export async function GET(_, { params }) {
  try {
    const { id } = await params;
    const alumni = await prisma.alumni.findUnique({
      where: { id },
      include: { employmentHistory: { orderBy: { id: "asc" } } },
    });
    if (!alumni) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(alumni);
  } catch (err) {
    console.error("GET /api/alumni/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { employmentHistory, ...rest } = body;

    // Whitelist fields — กัน unknown field error จาก Prisma
    const data = Object.fromEntries(
      ALUMNI_FIELDS.filter((k) => k in rest).map((k) => [k, rest[k]])
    );

    // Validate field lengths ก่อนถึง Prisma — คืน error ที่บอกชื่อ field ชัดเจน
    const tooLong = [
      ...findTooLongFields(data, ALUMNI_VARCHAR_LIMITS),
      ...(employmentHistory ?? []).flatMap((job, i) =>
        findTooLongFields(job, EMPLOYMENT_VARCHAR_LIMITS).map((err) => ({
          ...err,
          field: `employmentHistory[${i}].${err.field}`,
        }))
      ),
    ];
    if (tooLong.length > 0) {
      return NextResponse.json(
        { error: `มีข้อความยาวเกินกำหนด — ${describeTooLongFields(tooLong)}` },
        { status: 400 }
      );
    }

    const alumni = await prisma.$transaction(async (tx) => {
      if (employmentHistory !== undefined) {
        // ลบ employment history เดิมทั้งหมดก่อน
        await tx.alumniEmploymentHistory.deleteMany({ where: { alumniId: id } });
      }
      return tx.alumni.update({
        where: { id },
        data: {
          ...data,
          employmentHistory: employmentHistory?.length
            ? {
                create: employmentHistory.map(
                  // Strip id/alumniId ก่อน create (เหมือน prepEnrollments ของ student)
                  ({ id: _id, alumniId: _aid, ...job }) => job
                ),
              }
            : undefined,
        },
        include: { employmentHistory: { orderBy: { id: "asc" } } },
      });
    });
    return NextResponse.json(alumni);
  } catch (err) {
    console.error("PUT /api/alumni/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  try {
    const { id } = await params;
    await prisma.alumni.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/alumni/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
