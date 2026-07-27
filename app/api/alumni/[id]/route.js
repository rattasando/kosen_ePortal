import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_, { params }) {
  const { id } = await params;
  const alumni = await prisma.alumni.findUnique({
    where: { id },
    include: { employmentHistory: true },
  });
  if (!alumni) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(alumni);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const { employmentHistory, ...data } = await request.json();

  const alumni = await prisma.$transaction(async (tx) => {
    if (employmentHistory !== undefined) {
      await tx.alumniEmploymentHistory.deleteMany({ where: { alumniId: id } });
    }
    return tx.alumni.update({
      where: { id },
      data: {
        ...data,
        employmentHistory: employmentHistory?.length
          ? { create: employmentHistory }
          : undefined,
      },
      include: { employmentHistory: true },
    });
  });
  return NextResponse.json(alumni);
}

export async function DELETE(_, { params }) {
  const { id } = await params;
  await prisma.alumni.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
