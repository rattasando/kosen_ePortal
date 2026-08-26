import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/utils/apiHandler";

export const GET = withErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const where = studentId ? { studentId } : {};
  const items = await prisma.internship.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}, "GET /api/internships");

export const POST = withErrorHandler(async (request) => {
  const data = await request.json();
  const item = await prisma.internship.create({ data });
  return NextResponse.json(item, { status: 201 });
}, "POST /api/internships");
