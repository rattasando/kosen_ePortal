import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/utils/apiHandler";

/** field ที่รับจาก client — ตรงกับ schema (ยกเว้น id, createdAt, updatedAt, relations) */
const BANNER_FIELDS = [
  "layout", "eyebrow", "headline", "body", "badge",
  "newsId", "activityId",
  "ctaLabel", "ctaHref", "secondaryLabel", "secondaryHref",
  "image", "imagePosition", "textSize", "textAlign",
  "status", "order",
];

/**
 * แปลง "" → null สำหรับ field ที่เป็น relation FK
 * ป้องกัน Prisma P2003 (foreign key constraint failed) เมื่อ form ส่ง newsId/activityId = ""
 */
function normalizeRelations(data) {
  const out = { ...data };
  if (out.newsId === "")     out.newsId     = null;
  if (out.activityId === "") out.activityId = null;
  return out;
}

export const GET = withErrorHandler(async () => {
  const banners = await prisma.banner.findMany({
    orderBy: { order: "asc" },
  });
  return NextResponse.json(banners);
}, "GET /api/banners");

export const POST = withErrorHandler(async (request) => {
  const raw = await request.json();

  // whitelist + normalize relation fields ก่อนส่ง Prisma
  const data = normalizeRelations(
    Object.fromEntries(
      ["id", "order", ...BANNER_FIELDS].filter((k) => k in raw).map((k) => [k, raw[k]])
    )
  );

  const banner = await prisma.banner.create({ data });
  return NextResponse.json(banner, { status: 201 });
}, "POST /api/banners");
