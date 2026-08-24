import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.newsCategory.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json(categories);
  } catch (err) {
    console.error("GET /api/news-categories:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();

    // auto-generate id: CAT-NNN
    const all = await prisma.newsCategory.findMany({ select: { id: true } });
    const nums = all
      .map((c) => parseInt(c.id.replace("CAT-", ""), 10))
      .filter((n) => !isNaN(n));
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    const id = `CAT-${String(next).padStart(3, "0")}`;

    const maxOrder = all.length;

    const category = await prisma.newsCategory.create({
      data: {
        id,
        name: data.name,
        color: data.color,
        order: data.order ?? maxOrder,
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    console.error("POST /api/news-categories:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
