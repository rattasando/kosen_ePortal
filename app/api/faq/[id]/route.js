import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/utils/apiHandler";

export const GET = withErrorHandler(async (_, { params }) => {
  const { id } = await params;
  const faq = await prisma.faq.findUnique({ where: { id } });
  if (!faq) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(faq);
}, "GET /api/faq/[id]");

export const PUT = withErrorHandler(async (request, { params }) => {
  const { id } = await params;
  const data = await request.json();
  const faq = await prisma.faq.update({ where: { id }, data });
  return NextResponse.json(faq);
}, "PUT /api/faq/[id]");

export const DELETE = withErrorHandler(async (_, { params }) => {
  const { id } = await params;
  await prisma.faq.delete({ where: { id } });
  return NextResponse.json({ success: true });
}, "DELETE /api/faq/[id]");
