import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/utils/apiHandler";

export const GET = withErrorHandler(async () => {
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(companies);
}, "GET /api/companies");

export const POST = withErrorHandler(async (request) => {
  const data = await request.json();
  const company = await prisma.company.create({
    data: { ...data, mouExpiry: data.mouExpiry ? new Date(data.mouExpiry) : null },
  });
  return NextResponse.json(company, { status: 201 });
}, "POST /api/companies");
