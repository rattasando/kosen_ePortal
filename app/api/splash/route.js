import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// field ที่แก้ไขได้ — ยกเว้น id, updatedAt (read-only), updater (relation)
const SPLASH_FIELDS = [
  "enabled", "image", "title", "body",
  "ctaLabel", "ctaHref", "showFrequency",
  "delayMs", "width", "border", "radius",
];

// UI ใช้ "2xl"/"3xl" ตรงๆ แต่ Prisma enum ชื่อ r2xl/r3xl (มี @map)
const RADIUS_TO_PRISMA   = { "2xl": "r2xl", "3xl": "r3xl" };
const RADIUS_FROM_PRISMA = { r2xl: "2xl",   r3xl: "3xl"   };

function toClient(splash) {
  if (!splash) return splash;
  return {
    ...splash,
    radius: RADIUS_FROM_PRISMA[splash.radius] ?? splash.radius,
  };
}

export async function GET() {
  try {
    let splash = await prisma.splashConfig.findFirst();
    if (!splash) {
      splash = await prisma.splashConfig.create({ data: {} });
    }
    return NextResponse.json(toClient(splash));
  } catch (err) {
    console.error("GET /api/splash:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();

    // 1. whitelist — กรอง field ที่ Prisma รับได้เท่านั้น
    const data = Object.fromEntries(
      SPLASH_FIELDS.filter((k) => k in body).map((k) => [k, body[k]])
    );

    // 2. แปลง radius จาก UI format → Prisma enum name
    if (data.radius && RADIUS_TO_PRISMA[data.radius]) {
      data.radius = RADIUS_TO_PRISMA[data.radius];
    }

    let splash = await prisma.splashConfig.findFirst();
    if (splash) {
      splash = await prisma.splashConfig.update({ where: { id: splash.id }, data });
    } else {
      splash = await prisma.splashConfig.create({ data });
    }
    return NextResponse.json(toClient(splash));
  } catch (err) {
    console.error("PUT /api/splash:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
