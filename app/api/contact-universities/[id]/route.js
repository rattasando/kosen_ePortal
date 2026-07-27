import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request, { params }) {
  const { id } = await params;
  const data = await request.json();
  const university = await prisma.contactUniversity.update({ where: { id }, data });
  return NextResponse.json(university);
}

export async function DELETE(_, { params }) {
  const { id } = await params;
  await prisma.contactUniversity.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
