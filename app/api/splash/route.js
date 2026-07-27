import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let splash = await prisma.splashConfig.findFirst();
  if (!splash) {
    // Auto-create default
    splash = await prisma.splashConfig.create({ data: {} });
  }
  return NextResponse.json(splash);
}

export async function PUT(request) {
  const data = await request.json();
  let splash = await prisma.splashConfig.findFirst();
  if (splash) {
    splash = await prisma.splashConfig.update({ where: { id: splash.id }, data });
  } else {
    splash = await prisma.splashConfig.create({ data });
  }
  return NextResponse.json(splash);
}
