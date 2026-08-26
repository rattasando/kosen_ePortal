import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/utils/apiHandler";

export const PATCH = withErrorHandler(async (request) => {
  const { ids } = await request.json();
  await prisma.$transaction(
    ids.map((id, i) => prisma.banner.update({ where: { id }, data: { order: i } }))
  );
  return NextResponse.json({ success: true });
}, "PATCH /api/banners/reorder");
