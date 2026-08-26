import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { withErrorHandler } from "@/lib/utils/apiHandler";

export const GET = withErrorHandler(async (_, { params }) => {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, username: true, name: true, nameEn: true,
      email: true, role: true, department: true, university: true,
      tel: true, lastLogin: true, status: true, note: true,
      createdAt: true, updatedAt: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}, "GET /api/users/[id]");

export const PUT = withErrorHandler(async (request, { params }) => {
  const { id } = await params;
  const body = await request.json();

  let data = { ...body };
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  } else {
    delete data.password;
  }

  const user = await prisma.user.update({ where: { id }, data });
  return NextResponse.json(user);
}, "PUT /api/users/[id]");

export const DELETE = withErrorHandler(async (_, { params }) => {
  const { id } = await params;
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}, "DELETE /api/users/[id]");
