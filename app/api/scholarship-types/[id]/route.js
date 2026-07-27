import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_, { params }) {
  const { id } = await params;
  const type = await prisma.scholarshipType.findUnique({ where: { id } });
  if (!type) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(type);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const data = await request.json();
  const type = await prisma.scholarshipType.update({ where: { id }, data });
  return NextResponse.json(type);
}

export async function DELETE(_, { params }) {
  const { id } = await params;
  await prisma.scholarshipType.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
