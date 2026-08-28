import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, ok, created } from "@/lib/utils/apiHandler";

export const GET = withErrorHandler(async () => {
  const alumni = await prisma.alumni.findMany({
    orderBy: { graduatedYear: "desc" },
    include: { employmentHistory: { orderBy: { id: "asc" } } },
  });
  return ok(alumni);
}, "GET /api/alumni");

export const POST = withErrorHandler(async (request) => {
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
  return created(alumni);
}, "POST /api/alumni");
