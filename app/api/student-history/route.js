import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toEvent(row) {
  const extra = (row.newData && typeof row.newData === "object") ? row.newData : {};
  return {
    id: String(row.id),
    studentId: row.studentId,
    at: row.changedAt,
    by: row.changedBy ?? "admin",
    type: row.actionType,
    before: row.oldData ?? null,
    after: extra.after ?? null,
    changes: extra.changes ?? [],
    summary: extra.summary ?? "",
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const where = studentId ? { studentId } : {};
  const rows = await prisma.studentHistory.findMany({
    where,
    orderBy: { changedAt: "desc" },
    take: 500,
  });
  return NextResponse.json(rows.map(toEvent));
}

export async function POST(request) {
  const { studentId, type, before, after, changes, summary, by } = await request.json();
  const row = await prisma.studentHistory.create({
    data: {
      studentId,
      actionType: type,
      oldData: before ?? undefined,
      newData: { after, changes, summary },
      changedBy: by ?? null,
    },
  });
  return NextResponse.json(toEvent(row), { status: 201 });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  if (studentId) {
    await prisma.studentHistory.deleteMany({ where: { studentId } });
  }
  return NextResponse.json({ success: true });
}
