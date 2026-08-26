import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/utils/apiHandler";

export const GET = withErrorHandler(async (_, { params }) => {
  const { id } = await params;
  const item = await prisma.internship.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}, "GET /api/internships/[id]");

export const PUT = withErrorHandler(async (request, { params }) => {
  const { id } = await params;
  const data = await request.json();
  const item = await prisma.internship.update({ where: { id }, data });
  return NextResponse.json(item);
}, "PUT /api/internships/[id]");

export const DELETE = withErrorHandler(async (_, { params }) => {
  const { id } = await params;
  await prisma.internship.delete({ where: { id } });
  return NextResponse.json({ success: true });
}, "DELETE /api/internships/[id]");
