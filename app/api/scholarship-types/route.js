import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const types = await prisma.scholarshipType.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(types);
}

export async function POST(request) {
  const data = await request.json();
  const type = await prisma.scholarshipType.create({ data });
  return NextResponse.json(type, { status: 201 });
}
