import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where = {};
  if (status) where.status = status;

  const faqs = await prisma.faq.findMany({ where, orderBy: { order: "asc" } });
  return NextResponse.json(faqs);
}

export async function POST(request) {
  const data = await request.json();
  const faq = await prisma.faq.create({ data });
  return NextResponse.json(faq, { status: 201 });
}
