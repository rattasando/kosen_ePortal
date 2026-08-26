/**
 * base.fixture.js — Extended Playwright test fixture
 * ─────────────────────────────────────────────────────────────
 * ใช้แทน `import { test } from "@playwright/test"` ใน test files
 * เพื่อได้ helper methods เพิ่มเติมโดยไม่ต้องเขียนซ้ำในทุก test
 */

import { test as base, expect } from "@playwright/test";

export { expect };

export const test = base.extend({
  /**
   * apiRequest — ส่ง HTTP request ตรงไปยัง API (bypass browser)
   * ใช้สำหรับ setup/teardown ข้อมูลก่อน/หลัง test
   * session cookie ถูก inject โดยอัตโนมัติจาก storageState
   */
  apiRequest: async ({ request }, use) => {
    await use(request);
  },

  /**
   * adminPage — navigate ไปหน้า admin แล้วรอให้โหลดเสร็จ
   * รับ path ที่ต้องการ เช่น "/admin/information/faq"
   */
  adminPage: async ({ page }, use) => {
    const go = async (path) => {
      await page.goto(path);
      // รอให้ main content โหลด (ไม่ใช่ loading spinner)
      await page.waitForLoadState("networkidle");
    };
    await use({ page, go });
  },
});
