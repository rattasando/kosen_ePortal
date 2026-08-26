import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { withErrorHandler } from "@/lib/utils/apiHandler";

export const GET = withErrorHandler(async () => {
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
}, "GET /api/users");

export const POST = withErrorHandler(async (request) => {
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
}, "POST /api/users");
