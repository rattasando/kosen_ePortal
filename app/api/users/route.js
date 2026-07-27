import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true, username: true, name: true, nameEn: true,
      email: true, role: true, department: true, university: true,
      tel: true, lastLogin: true, status: true, note: true,
      createdAt: true, updatedAt: true,
    },
  });
  return NextResponse.json(users);
}

export async function POST(request) {
  const body = await request.json();
  const { password, ...rest } = body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { ...rest, password: hashedPassword },
    select: {
      id: true, username: true, name: true, email: true,
      role: true, status: true, createdAt: true,
    },
  });
  return NextResponse.json(user, { status: 201 });
}
