import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/utils/apiHandler";

export const GET = withErrorHandler(async () => {
  const universities = await prisma.contactUniversity.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(universities);
}, "GET /api/contact-universities");

export const POST = withErrorHandler(async (request) => {
  const data = await request.json();
  const university = await prisma.contactUniversity.create({ data });
  return NextResponse.json(university, { status: 201 });
}, "POST /api/contact-universities");
