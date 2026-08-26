import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/utils/apiHandler";

export const GET = withErrorHandler(async () => {
  const types = await prisma.scholarshipType.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(types);
}, "GET /api/scholarship-types");

export const POST = withErrorHandler(async (request) => {
  const data = await request.json();
  const type = await prisma.scholarshipType.create({ data });
  return NextResponse.json(type, { status: 201 });
}, "POST /api/scholarship-types");
