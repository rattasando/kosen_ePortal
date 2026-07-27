import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const universities = await prisma.contactUniversity.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(universities);
}

export async function POST(request) {
  const data = await request.json();
  const university = await prisma.contactUniversity.create({ data });
  return NextResponse.json(university, { status: 201 });
}
