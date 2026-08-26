import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/utils/apiHandler";

export const PUT = withErrorHandler(async (request, { params }) => {
  const { id } = await params;
  const data = await request.json();
  const item = await prisma.contactInfo.update({ where: { id }, data });
  return NextResponse.json(item);
}, "PUT /api/contact-info/[id]");

export const DELETE = withErrorHandler(async (_, { params }) => {
  const { id } = await params;
  await prisma.contactInfo.delete({ where: { id } });
  return NextResponse.json({ success: true });
}, "DELETE /api/contact-info/[id]");
