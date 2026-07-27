import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_, { params }) {
  const { id } = await params;
  const faq = await prisma.faq.findUnique({ where: { id } });
  if (!faq) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(faq);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const data = await request.json();
  const faq = await prisma.faq.update({ where: { id }, data });
  return NextResponse.json(faq);
}

export async function DELETE(_, { params }) {
  const { id } = await params;
  await prisma.faq.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
