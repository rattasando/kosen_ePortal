import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;

  const documents = await prisma.document.findMany({
    where,
    orderBy: { rawDate: "desc" },
  });
  return NextResponse.json(documents);
}

export async function POST(request) {
  const data = await request.json();
  const document = await prisma.document.create({
    data: { ...data, rawDate: data.rawDate ? new Date(data.rawDate) : null },
  });
  return NextResponse.json(document, { status: 201 });
}
