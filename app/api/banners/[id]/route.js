import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// field ที่แก้ไขได้ — ตรงกับ schema (ยกเว้น id, createdAt, updatedAt, relations)
const BANNER_FIELDS = [
  "layout", "eyebrow", "headline", "body", "badge",
  "newsId", "activityId",
  "ctaLabel", "ctaHref", "secondaryLabel", "secondaryHref",
  "image", "imagePosition", "textSize", "textAlign",
  "status", "order",
];

export async function GET(_, { params }) {
  const { id } = await params;
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(banner);
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // กรองเฉพาะ field ที่อยู่ใน schema — ป้องกัน "Unknown argument" จาก Prisma
    const data = Object.fromEntries(
      BANNER_FIELDS.filter((k) => k in body).map((k) => [k, body[k]])
    );

    const banner = await prisma.banner.update({ where: { id }, data });
    return NextResponse.json(banner);
  } catch (err) {
    console.error("PUT /api/banners/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  try {
    const { id } = await params;
    await prisma.banner.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/banners/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
