import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/utils/apiHandler";

export const GET = withErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;

  const documents = await prisma.document.findMany({
    where,
    orderBy: { rawDate: "desc" },
  });
  return NextResponse.json(documents);
}, "GET /api/documents");

export const POST = withErrorHandler(async (request) => {
  const data = await request.json();
  const document = await prisma.document.create({
    data: { ...data, rawDate: data.rawDate ? new Date(data.rawDate) : null },
  });
  return NextResponse.json(document, { status: 201 });
}, "POST /api/documents");
