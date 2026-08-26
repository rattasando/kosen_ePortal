import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/utils/apiHandler";

export const GET = withErrorHandler(async (_, { params }) => {
  const { id } = await params;
  const type = await prisma.scholarshipType.findUnique({ where: { id } });
  if (!type) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(type);
}, "GET /api/scholarship-types/[id]");

export const PUT = withErrorHandler(async (request, { params }) => {
  const { id } = await params;
  const data = await request.json();
  const type = await prisma.scholarshipType.update({ where: { id }, data });
  return NextResponse.json(type);
}, "PUT /api/scholarship-types/[id]");

export const DELETE = withErrorHandler(async (_, { params }) => {
  const { id } = await params;
  await prisma.scholarshipType.delete({ where: { id } });
  return NextResponse.json({ success: true });
}, "DELETE /api/scholarship-types/[id]");
