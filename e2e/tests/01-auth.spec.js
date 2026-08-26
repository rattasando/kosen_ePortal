/**
 * 01-auth.spec.js — ทดสอบ Authentication (Login / Logout)
 * ─────────────────────────────────────────────────────────────
 * ทดสอบ:
 *   - Login สำเร็จ → redirect /admin
 *   - Login ผิดพลาดทุก BVA case (password ผิด, username ผิด, ช่องว่าง)
 *   - Session ยังอยู่หลัง reload
 *   - เข้า /admin โดยตรงโดยไม่ login → redirect login
 *
 * ⚠️  ไม่ใช้ storageState — login ด้วยตัวเอง
 */

import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage.js";
import { ADMIN_USER, LOGIN_CASES } from "../data/auth.data.js";

// ไม่ใช้ session ที่ setup ไว้ — test นี้ต้องการ clean state
test.use({ storageState: { cookies: [], origins: [] } });

// ── Login สำเร็จ ──────────────────────────────────────────────

test("login สำเร็จ → redirect ไปหน้า admin", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginFull(ADMIN_USER.username, ADMIN_USER.password);
  await loginPage.expectRedirectToAdmin();
});

// ── Login ล้มเหลว — BVA cases ─────────────────────────────────

// กรณีที่ submit ได้ (username+password มีค่า แต่ credentials ผิด)
for (const c of LOGIN_CASES.filter((c) => c.expect === "error" && c.username && c.password)) {
  test(`login ล้มเหลว: ${c.label}`, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginFull(c.username, c.password);
    await loginPage.expectStayOnLogin();
  });
}

// กรณีที่ปุ่ม disabled เพราะ field ว่าง (HTML required + button disabled)
for (const c of LOGIN_CASES.filter((c) => c.expect === "error" && (!c.username || !c.password))) {
  test(`login ล้มเหลว: ${c.label} (ปุ่ม disabled)`, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(c.username, c.password);

    // ปุ่ม disabled → URL ต้องยังเป็น /login
    await expect(page).toHaveURL(/\/login/);
    // ตรวจ disabled attribute
    await expect(loginPage.submitButton).toBeDisabled();
  });
}

// ── Session persistence ───────────────────────────────────────

test("session ยังคงอยู่หลัง page reload", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginFull(ADMIN_USER.username, ADMIN_USER.password);
  await loginPage.expectRedirectToAdmin();

  await page.reload();
  await expect(page).toHaveURL(/\/admin/, { timeout: 8_000 });
});

// ── Redirect guard ────────────────────────────────────────────

test("เข้า /admin โดยตรงโดยไม่ login → redirect ไปหน้า login", async ({ page }) => {
  await page.goto("/admin/students/list");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/\/login/);
});
