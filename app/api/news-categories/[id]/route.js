import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const category = await prisma.newsCategory.update({
      where: { id },
      data: {
        name: data.name,
        color: data.color,
        order: data.order,
      },
    });
    return NextResponse.json(category);
  } catch (err) {
    console.error("PUT /api/news-categories/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  try {
    const { id } = await params;
    await prisma.newsCategory.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/news-categories/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
