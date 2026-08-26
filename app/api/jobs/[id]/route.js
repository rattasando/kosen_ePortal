import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/utils/apiHandler";

export const GET = withErrorHandler(async (_, { params }) => {
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: { company: { select: { id: true, name: true } } },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(job);
}, "GET /api/jobs/[id]");

/** Scalar fields ที่ Prisma รับสำหรับ Job — strip relations + auto-managed fields */
const JOB_FIELDS = [
  "title", "titleEn", "type", "field", "companyId", "companyName", "companyLogo",
  "salary", "duration", "slots", "applications", "status", "featured",
  "startDate", "deadline", "location", "description", "requirements", "benefits",
  "skills", "tags",
];

export const PUT = withErrorHandler(async (request, { params }) => {
  const { id } = await params;
  const rawData = await request.json();

  // กรอง relation + auto-managed fields ออก (เหมือน Student/News/Banner PUT)
  const data = Object.fromEntries(
    JOB_FIELDS.filter((k) => k in rawData).map((k) => [k, rawData[k]])
  );

  const job = await prisma.job.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : null,
      deadline: data.deadline ? new Date(data.deadline) : null,
    },
  });
  return NextResponse.json(job);
}, "PUT /api/jobs/[id]");

export const DELETE = withErrorHandler(async (_, { params }) => {
  const { id } = await params;
  await prisma.job.delete({ where: { id } });
  return NextResponse.json({ success: true });
}, "DELETE /api/jobs/[id]");
