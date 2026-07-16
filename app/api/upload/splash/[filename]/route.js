import { unlink, access } from "fs/promises";
import { join, basename } from "path";
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
  try {
    const { filename } = await params;

    // ป้องกัน path traversal
    const safe = basename(filename);
    if (!safe || safe !== filename || safe.includes("..")) {
      return NextResponse.json({ error: "ชื่อไฟล์ไม่ถูกต้อง" }, { status: 400 });
    }

    const filePath = join(process.cwd(), "public", "splash", safe);

    // ตรวจสอบว่าไฟล์มีอยู่
    try {
      await access(filePath);
    } catch {
      return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 404 });
    }

    await unlink(filePath);
    return NextResponse.json({ success: true, filename: safe });
  } catch (err) {
    console.error("[upload/splash/delete]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบไฟล์" }, { status: 500 });
  }
}
