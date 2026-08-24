import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── helpers ──────────────────────────────────────────────────
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

// ── GET /api/mappings ─────────────────────────────────────────
export async function GET() {
  try {
    const list = await prisma.jobApplication.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(list.map(toClient));
  } catch (err) {
    console.error("GET /api/mappings:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── POST /api/mappings ────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const { id, studentId, jobId, status, appliedDate, note, reviewedBy } = body;

    if (!studentId || !jobId) {
      return NextResponse.json({ error: "studentId และ jobId จำเป็น" }, { status: 400 });
    }

    // auto-generate id ถ้าไม่ส่งมา
    let newId = id?.trim();
    if (!newId) {
      const last = await prisma.jobApplication.findMany({
        orderBy: { id: "desc" },
        take: 1,
        select: { id: true },
      });
      const lastNum = last.length ? parseInt(last[0].id.replace("MAP-", ""), 10) || 0 : 0;
      newId = `MAP-${String(lastNum + 1).padStart(3, "0")}`;
    }

    const created = await prisma.jobApplication.create({
      data: {
        id:          newId,
        studentId,
        jobId,
        status:      status ?? "สมัครแล้ว",
        appliedDate: appliedDate ? new Date(appliedDate) : null,
        note:        note ?? null,
        reviewedBy:  reviewedBy ?? null,
      },
    });
    return NextResponse.json(toClient(created), { status: 201 });
  } catch (err) {
    console.error("POST /api/mappings:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
