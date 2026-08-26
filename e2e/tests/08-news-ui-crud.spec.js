/**
 * 08-news-ui-crud.spec.js — ทดสอบ UI CRUD ของ News
 * ─────────────────────────────────────────────────────────────
 * News ใช้ NewsEditor overlay (fixed inset-0 z-50):
 *   - "+ เพิ่มข่าว" → NewsEditor
 *   - title: textarea placeholder="หัวข้อข่าว..."
 *   - author: input placeholder="เช่น ฝ่ายประชาสัมพันธ์ KOSEN"
 *   - Save button: "เผยแพร่" (add) / "บันทึก" (edit)
 *   - scope ปุ่มใน editor ด้วย .fixed.inset-0.z-50
 *     (เพราะมี status pill "เผยแพร่" ที่ background ด้วย)
 *
 *   - edit: ปุ่ม title="แก้ไข" ใน row → Editor
 *   - delete: ปุ่ม title="ลบ" → ConfirmDeleteModal "ลบข่าว"
 *
 * หมายเหตุ:
 * - ใช้ ASCII สำหรับ title/author (fill() กับ Thai text อาจทำให้ Chromium hang)
 * - Draft news (publishedAt=null) เรียง LAST ใน "default" sort (Prisma orderBy publishedAt desc)
 *   → ต้อง search ด้วย title เพื่อหาใน list แทน getByText โดยตรง
 */

import { test, expect } from "../fixtures/base.fixture.js";

const PAGE_URL = "/admin/information/news";

// ── helpers ───────────────────────────────────────────────────

function makeNewsData() {
  const ts = Date.now().toString().slice(-8);
  return {
    title:  `NEWS-UI-TEST-${ts}`,    // ASCII เท่านั้น → fill() ทำงานได้
    author: `AUTHOR-TEST-${ts}`,     // ASCII เท่านั้น
    ts,
  };
}

/** locator ของ NewsEditor overlay (fixed inset-0 z-50) */
const newsEditor = (page) => page.locator(".fixed.inset-0.z-50").last();

/**
 * สร้างข่าวผ่าน NewsEditor overlay
 * รอ POST /api/news response ก่อน return (ป้องกัน race condition)
 * หมายเหตุ: addNews() ใน NewsListClient ไม่ await → ต้องใช้ waitForResponse
 */
async function createNewsViaUI(page, { title, author }) {
  await page.getByRole("button", { name: "+ เพิ่มข่าว" }).click();

  const editor = newsEditor(page);
  await expect(editor.getByText("เพิ่มข่าวใหม่")).toBeVisible({ timeout: 5_000 });

  await page.getByPlaceholder("หัวข้อข่าว...").fill(title);
  await page.getByPlaceholder("เช่น ฝ่ายประชาสัมพันธ์ KOSEN").fill(author);

  // scope "เผยแพร่" ใน editor (ไม่ใช่ status pill "เผยแพร่" ที่ background)
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/news") && r.request().method() === "POST",
      { timeout: 10_000 }
    ),
    editor.getByRole("button", { name: "เผยแพร่", exact: true }).click(),
  ]);
  expect(response.status()).toBe(201);

  // editor ปิด
  await expect(editor.getByText("เพิ่มข่าวใหม่")).not.toBeVisible({ timeout: 8_000 });
}

/**
 * ค้นหาข่าวใน list ด้วย ASCII search term
 * Draft news จะอยู่หน้าสุดท้าย (publishedAt=null → sort last) → ต้อง search
 */
async function searchAndGetNewsRow(page, title) {
  const searchInput = page.getByPlaceholder(
    "หัวข้อ ผู้เขียน หมวดหมู่ แท็ก (Enter เพื่อค้นหา)"
  );
  await searchInput.fill(title);    // ASCII → fill() ทำงานได้

  const row = page.locator("tr, .group").filter({ hasText: title }).first();
  await expect(row).toBeVisible({ timeout: 10_000 });
  return row;
}

// ── tests ─────────────────────────────────────────────────────

test("หน้า News โหลดและแสดงปุ่ม '+ เพิ่มข่าว'", async ({ page }) => {
  await page.goto(PAGE_URL);
  await expect(page.getByRole("button", { name: "+ เพิ่มข่าว" })).toBeVisible();
});

test("กด '+ เพิ่มข่าว' → NewsEditor overlay ขึ้น", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.getByRole("button", { name: "+ เพิ่มข่าว" }).click();

  const editor = newsEditor(page);
  await expect(editor.getByText("เพิ่มข่าวใหม่")).toBeVisible({ timeout: 5_000 });
  await expect(page.getByPlaceholder("หัวข้อข่าว...")).toBeVisible();
  await expect(page.getByPlaceholder("เช่น ฝ่ายประชาสัมพันธ์ KOSEN")).toBeVisible();
});

test("กด '← ยกเลิก' ใน editor → ปิด overlay", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.getByRole("button", { name: "+ เพิ่มข่าว" }).click();

  const editor = newsEditor(page);
  await expect(editor.getByText("เพิ่มข่าวใหม่")).toBeVisible();

  await editor.getByRole("button", { name: "← ยกเลิก" }).click();
  await expect(editor.getByText("เพิ่มข่าวใหม่")).not.toBeVisible({ timeout: 3_000 });
});

test("สร้างข่าวใหม่สำเร็จ → ค้นหาเจอในรายการ", async ({ page }) => {
  const { title, author } = makeNewsData();
  await page.goto(PAGE_URL);
  await createNewsViaUI(page, { title, author });

  // ค้นหาด้วย ASCII title (draft news อยู่หน้าสุดท้ายโดย default sort)
  await searchAndGetNewsRow(page, title);
});

test("แก้ไขข่าว — เปลี่ยน title → API ยืนยัน", async ({ page }) => {
  const { title, author } = makeNewsData();
  await page.goto(PAGE_URL);
  await createNewsViaUI(page, { title, author });

  // ค้นหาก่อนเพื่อให้ row ปรากฏ
  const row = await searchAndGetNewsRow(page, title);
  await row.getByTitle("แก้ไข").click();

  const editor = newsEditor(page);
  await expect(editor.getByText(/แก้ไข:/)).toBeVisible({ timeout: 5_000 });

  // เปลี่ยน title
  const updatedTitle = `${title}-EDITED`;
  await page.getByPlaceholder("หัวข้อข่าว...").fill(updatedTitle);

  // edit mode ไม่ auto-fill author จาก item.authorName → กรอกเอง
  const authorInput = page.getByPlaceholder("เช่น ฝ่ายประชาสัมพันธ์ KOSEN");
  if (await authorInput.inputValue() === "") {
    await authorInput.fill(author);
  }

  // รอ PUT response + คลิก "บันทึก"
  const [putResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/news/") && r.request().method() === "PUT",
      { timeout: 10_000 }
    ),
    editor.getByRole("button", { name: "บันทึก", exact: true }).click(),
  ]);
  expect(putResp.ok()).toBeTruthy();

  // editor ปิด + ตรวจ response body
  await expect(editor.getByText(/แก้ไข:/)).not.toBeVisible({ timeout: 8_000 });
  const body = await putResp.json();
  expect(body.title).toBe(updatedTitle);
});

test("ลบข่าว → หายจากผลค้นหา", async ({ page }) => {
  const { title, author } = makeNewsData();
  await page.goto(PAGE_URL);
  await createNewsViaUI(page, { title, author });

  // ค้นหาก่อน
  const row = await searchAndGetNewsRow(page, title);
  await row.getByTitle("ลบ").click();

  // ConfirmDeleteModal
  await expect(page.getByText("ยืนยันการลบข่าว")).toBeVisible({ timeout: 5_000 });

  // รอ DELETE + คลิก confirm
  const [delResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/news/") && r.request().method() === "DELETE",
      { timeout: 10_000 }
    ),
    page.getByRole("button", { name: "ลบข่าว" }).click(),
  ]);
  expect(delResp.ok()).toBeTruthy();

  // modal ปิด + title หายจาก list
  await expect(page.getByText("ยืนยันการลบข่าว")).not.toBeVisible({ timeout: 5_000 });
  // search input ยังมีค่าอยู่ → ผล filter ควรว่างเปล่า (row ถูกลบ)
  await expect(
    page.locator("tr, .group").filter({ hasText: title })
  ).not.toBeVisible({ timeout: 5_000 });
});
