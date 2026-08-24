import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Fields ที่ Prisma ยอมรับ (ห้ามส่ง createdAt/updatedAt เป็นต้น)
const COMPANY_FIELDS = [
  "name", "nameEn", "industry", "type", "country", "province", "address",
  "website", "linkedin", "contactName", "contactEmail", "contactTel",
  "status", "mouStatus", "mouExpiry", "openPositions", "description", "note",
];

export async function GET(_, { params }) {
  try {
    const { id } = await params;
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(company);
  } catch (err) {
    console.error("GET /api/companies/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // กรองเฉพาะ field ที่ schema รู้จัก
    const raw = Object.fromEntries(
      COMPANY_FIELDS.filter((k) => k in body).map((k) => [k, body[k]])
    );

    // แปลง mouExpiry → Date (ถ้ามี) หรือ null ถ้า mouStatus ไม่ใช่ "มี MOU"
    const data = {
      ...raw,
      mouExpiry: raw.mouExpiry ? new Date(raw.mouExpiry) : null,
      openPositions: raw.openPositions != null ? parseInt(raw.openPositions, 10) || 0 : 0,
    };

    const company = await prisma.company.update({ where: { id }, data });
    return NextResponse.json(company);
  } catch (err) {
    console.error("PUT /api/companies/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  try {
    const { id } = await params;
    await prisma.company.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/companies/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
