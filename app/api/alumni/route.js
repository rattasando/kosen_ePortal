import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const alumni = await prisma.alumni.findMany({
      orderBy: { graduatedYear: "desc" },
      include: { employmentHistory: { orderBy: { id: "asc" } } },
    });
    return NextResponse.json(alumni);
  } catch (err) {
    console.error("GET /api/alumni:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { employmentHistory, ...data } = await request.json();
    const alumni = await prisma.alumni.create({
      data: {
        ...data,
        employmentHistory: employmentHistory?.length
          ? {
              create: employmentHistory.map(
                ({ id: _id, alumniId: _aid, ...job }) => job
              ),
            }
          : undefined,
      },
      include: { employmentHistory: { orderBy: { id: "asc" } } },
    });
    return NextResponse.json(alumni, { status: 201 });
  } catch (err) {
    console.error("POST /api/alumni:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
