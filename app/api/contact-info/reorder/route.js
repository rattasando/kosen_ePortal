import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request) {
  const { ids } = await request.json();
  await prisma.$transaction(
    ids.map((id, i) => prisma.contactInfo.update({ where: { id }, data: { order: i } }))
  );
  return NextResponse.json({ success: true });
}
