import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_, { params }) {
  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const data = await request.json();
  const doc = await prisma.document.update({
    where: { id },
    data: { ...data, rawDate: data.rawDate ? new Date(data.rawDate) : null },
  });
  return NextResponse.json(doc);
}

export async function DELETE(_, { params }) {
  const { id } = await params;
  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
