import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toClient(m) {
  return {
    id:          m.id,
    studentId:   m.studentId,
    jobId:       m.jobId,
    status:      m.status,
    appliedDate: m.appliedDate ? String(m.appliedDate).slice(0, 10) : null,
    reviewedBy:  m.reviewedBy ?? null,
    note:        m.note ?? "",
    createdAt:   m.createdAt,
    updatedAt:   m.updatedAt,
  };
}

// ── GET /api/mappings/[id] ────────────────────────────────────
export async function GET(_, { params }) {
  try {
    const { id } = await params;
    const m = await prisma.jobApplication.findUnique({ where: { id } });
    if (!m) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    return NextResponse.json(toClient(m));
  } catch (err) {
    console.error("GET /api/mappings/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── PUT /api/mappings/[id] ────────────────────────────────────
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { studentId, jobId, status, appliedDate, note, reviewedBy } = await request.json();

    const updated = await prisma.jobApplication.update({
      where: { id },
      data: {
        ...(studentId   !== undefined && { studentId }),
        ...(jobId       !== undefined && { jobId }),
        ...(status      !== undefined && { status }),
        ...(note        !== undefined && { note: note ?? null }),
        ...(reviewedBy  !== undefined && { reviewedBy: reviewedBy ?? null }),
        ...(appliedDate !== undefined && {
          appliedDate: appliedDate ? new Date(appliedDate) : null,
        }),
      },
    });
    return NextResponse.json(toClient(updated));
  } catch (err) {
    console.error("PUT /api/mappings/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── DELETE /api/mappings/[id] ─────────────────────────────────
export async function DELETE(_, { params }) {
  try {
    const { id } = await params;
    await prisma.jobApplication.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/mappings/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
