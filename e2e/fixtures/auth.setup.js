/**
 * auth.setup.js — Playwright global setup
 * ─────────────────────────────────────────────────────────────
 * Login ครั้งเดียวแล้ว save session state ไว้ที่ e2e/.auth/admin.json
 * test อื่นทั้งหมดใช้ state นี้ ไม่ต้อง login ซ้ำ
 */

import { test as setup, expect } from "@playwright/test";
import { ADMIN_USER } from "../data/auth.data.js";

const AUTH_FILE = "e2e/.auth/admin.json";

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");

  // Selectors ตรงกับ app/(public)/login/page.js จริง
  await page.locator('input[type="text"][placeholder="username"]').fill(ADMIN_USER.username);
  await page.locator('input[type="password"]').fill(ADMIN_USER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

  // รอจนกว่าจะ redirect ไปหน้า admin
  await expect(page).toHaveURL(/\/admin/, { timeout: 10_000 });

  // Save session cookies + localStorage
  await page.context().storageState({ path: AUTH_FILE });
});
