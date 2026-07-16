import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { NextResponse } from "next/server";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "ไม่พบไฟล์ที่อัปโหลด" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "รองรับเฉพาะไฟล์ JPG, PNG, WebP, GIF" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "ขนาดไฟล์ต้องไม่เกิน 5 MB" }, { status: 400 });
    }

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext    = extname(file.name).toLowerCase() || ".jpg";
    const filename  = `splash-${Date.now()}${ext}`;
    const uploadDir = join(process.cwd(), "public", "splash");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), buffer);

    return NextResponse.json({ path: `/splash/${filename}`, filename });
  } catch (err) {
    console.error("[upload/splash]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์" }, { status: 500 });
  }
}
