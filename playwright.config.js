// @ts-check
import { defineConfig, devices } from "@playwright/test";

/**
 * playwright.config.js
 * ─────────────────────────────────────────────────────────────
 * ทดสอบ E2E สำหรับ KOSEN ePortal (admin + public pages)
 *
 * รันก่อนใช้:
 *   npm run dev          ← เปิด server ที่ localhost:3000
 *   npx playwright test  ← รัน test ทั้งหมด
 *   npx playwright test --ui  ← เปิด UI mode
 */

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,   // รัน sequential เพราะ share DB เดียวกัน
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 15_000,        // 15 วินาทีต่อ test
  expect: { timeout: 5_000 },

  reporter: [
    ["html", { outputFolder: "e2e/report", open: "never" }],
    ["list"],
  ],

  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
    locale: "th-TH",
    timezoneId: "Asia/Bangkok",
  },

  projects: [
    // Setup: login แล้ว save session state ให้ test อื่นใช้ต่อ
    {
      name: "setup",
      testMatch: "**/fixtures/auth.setup.js",
    },
    // E2E tests ทั้งหมด ใช้ session ที่ setup ไว้
    {
      name: "chromium",
      testMatch: "**/tests/**/*.spec.js",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/admin.json",
      },
      dependencies: ["setup"],
    },
  ],

  // ไม่ใช้ webServer block — รัน `npm run dev` แยกเอง
});
