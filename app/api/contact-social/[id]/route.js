import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request, { params }) {
  const { id } = await params;
  const data = await request.json();
  const item = await prisma.contactSocial.update({ where: { id }, data });
  return NextResponse.json(item);
}

export async function DELETE(_, { params }) {
  const { id } = await params;
  await prisma.contactSocial.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
