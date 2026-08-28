/**
 * 39-stub-pages-smoke.spec.js — Smoke tests สำหรับหน้า 🔧 ที่ยัง implement ไม่ครบ
 * ─────────────────────────────────────────────────────────────
 * เช็คว่าแต่ละหน้า navigate ได้, ไม่ crash, โหลดได้ปกติ
 * ไม่ทดสอบ CRUD เพราะ UI ยังเป็น stub
 */

import { test, expect } from "../fixtures/base.fixture.js";

const STUB_PAGES = [
  {
    name: "Information / Activities",
    url: "/admin/information/activities",
    // activities page returns null — ตรวจว่าไม่ crash (ไม่มี error page)
    check: null,
  },
  {
    name: "Information / News Categories",
    url: "/admin/information/news-categories",
    // แสดง "N หมวดหมู่" หรือ "+ เพิ่มหมวดหมู่" — ตรวจ partial text
    check: /หมวดหมู่/i,
  },
  {
    name: "Information / Scholarship Types",
    url: "/admin/information/scholarship-types",
    check: /Scholarship Types/i,
  },
  {
    name: "Information / Contact",
    url: "/admin/information/contact",
    check: /Contact/i,
  },
  {
    name: "Marketplace / Internship Tracking",
    url: "/admin/marketplace/internship-tracking",
    check: /Internship/i,
  },
  {
    name: "Students / Documents",
    url: "/admin/students/documents",
    check: /Document/i,
  },
  {
    name: "Students / Academic Tracking",
    url: "/admin/students/academic-tracking",
    check: /Academic|Tracking/i,
  },
  {
    name: "Students / Scholarship",
    url: "/admin/students/scholarship",
    check: /Scholarship/i,
  },
  {
    name: "System / Users",
    url: "/admin/users",
    check: /User Management|ผู้ใช้/i,
  },
];

for (const { name, url, check } of STUB_PAGES) {
  test(`Smoke — ${name} → navigate ได้, ไม่ crash`, async ({ page }) => {
    // ดัก console error ที่บ่งบอก crash
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto(url);

    // รอ network idle หรือ 3 วินาที
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1_000);

    // ไม่มี Next.js error page
    await expect(page.getByText(/Application error|This page crashed/i)).not.toBeVisible();

    // React runtime error ไม่ควรปรากฏ
    const reactErrors = errors.filter((e) =>
      e.includes("React") || e.includes("Uncaught") || e.includes("TypeError")
    );
    expect(reactErrors).toHaveLength(0);

    // ถ้า check กำหนดไว้ → ตรวจ text
    if (check) {
      await expect(page.getByText(check).first()).toBeVisible({ timeout: 8_000 });
    }
  });
}
