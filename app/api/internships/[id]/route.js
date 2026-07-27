import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_, { params }) {
  const { id } = await params;
  const item = await prisma.internship.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const data = await request.json();
  const item = await prisma.internship.update({ where: { id }, data });
  return NextResponse.json(item);
}

export async function DELETE(_, { params }) {
  const { id } = await params;
  await prisma.internship.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
