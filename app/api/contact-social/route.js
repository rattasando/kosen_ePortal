import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/utils/apiHandler";

export const GET = withErrorHandler(async () => {
  const items = await prisma.contactSocial.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(items);
}, "GET /api/contact-social");

export const POST = withErrorHandler(async (request) => {
  const data = await request.json();
  const item = await prisma.contactSocial.create({ data });
  return NextResponse.json(item, { status: 201 });
}, "POST /api/contact-social");
