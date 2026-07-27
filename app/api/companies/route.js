import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(companies);
}

export async function POST(request) {
  const data = await request.json();
  const company = await prisma.company.create({
    data: { ...data, mouExpiry: data.mouExpiry ? new Date(data.mouExpiry) : null },
  });
  return NextResponse.json(company, { status: 201 });
}
