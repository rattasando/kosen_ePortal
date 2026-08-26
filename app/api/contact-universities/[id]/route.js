import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/utils/apiHandler";

export const PUT = withErrorHandler(async (request, { params }) => {
  const { id } = await params;
  const data = await request.json();
  const university = await prisma.contactUniversity.update({ where: { id }, data });
  return NextResponse.json(university);
}, "PUT /api/contact-universities/[id]");

export const DELETE = withErrorHandler(async (_, { params }) => {
  const { id } = await params;
  await prisma.contactUniversity.delete({ where: { id } });
  return NextResponse.json({ success: true });
}, "DELETE /api/contact-universities/[id]");
