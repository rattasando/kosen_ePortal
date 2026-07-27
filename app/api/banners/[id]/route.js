import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_, { params }) {
  const { id } = await params;
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(banner);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const data = await request.json();
  const banner = await prisma.banner.update({ where: { id }, data });
  return NextResponse.json(banner);
}

export async function DELETE(_, { params }) {
  const { id } = await params;
  await prisma.banner.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
