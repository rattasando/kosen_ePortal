import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toEvent(row) {
  const extra = (row.newData && typeof row.newData === "object") ? row.newData : {};
  return {
    id: String(row.id),
    alumniId: row.alumniId,
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
  const alumniId = searchParams.get("alumniId");
  const where = alumniId ? { alumniId } : {};
  const rows = await prisma.alumniHistory.findMany({
    where,
    orderBy: { changedAt: "desc" },
    take: 500,
  });
  return NextResponse.json(rows.map(toEvent));
}

export async function POST(request) {
  const { alumniId, type, before, after, changes, summary, by } = await request.json();
  const row = await prisma.alumniHistory.create({
    data: {
      alumniId,
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
  const alumniId = searchParams.get("alumniId");
  if (alumniId) {
    await prisma.alumniHistory.deleteMany({ where: { alumniId } });
  }
  return NextResponse.json({ success: true });
}
