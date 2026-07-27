import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_, { params }) {
  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(company);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const data = await request.json();
  const company = await prisma.company.update({
    where: { id },
    data: { ...data, mouExpiry: data.mouExpiry ? new Date(data.mouExpiry) : null },
  });
  return NextResponse.json(company);
}

export async function DELETE(_, { params }) {
  const { id } = await params;
  await prisma.company.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
