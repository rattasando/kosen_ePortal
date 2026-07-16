import { readdir, stat } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export async function GET() {
  try {
    const dir = join(process.cwd(), "public", "splash");
    const entries = await readdir(dir);

    const files = await Promise.all(
      entries
        .filter((name) => {
          const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
          return IMAGE_EXTS.has(ext);
        })
        .map(async (name) => {
          const s = await stat(join(dir, name));
          return { name, path: `/splash/${name}`, size: s.size, mtime: s.mtimeMs };
        })
    );

    // เรียงล่าสุดก่อน
    files.sort((a, b) => b.mtime - a.mtime);

    return NextResponse.json({ files });
  } catch (err) {
    // โฟลเดอร์ยังไม่มีไฟล์ ส่งกลับ array ว่าง
    if (err.code === "ENOENT") return NextResponse.json({ files: [] });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
