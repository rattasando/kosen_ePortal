/**
 * LoginPage.js — Page Object Model สำหรับหน้า /login
 * ─────────────────────────────────────────────────────────────
 * Selectors อ้างอิงจาก app/(public)/login/page.js จริง:
 *   - input[type="text"]   placeholder="username"
 *   - input[type="password"]
 *   - button type="submit" text="เข้าสู่ระบบ"
 *   - error: div.text-danger (แสดงเมื่อ login ล้มเหลว)
 */

export class LoginPage {
  constructor(page) {
    this.page = page;

    // Locators — ใช้ placeholder/type แทน label (label ไม่มี htmlFor)
    this.usernameInput = page.locator('input[type="text"][placeholder="username"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton  = page.getByRole("button", { name: "เข้าสู่ระบบ" });
    this.errorDiv      = page.locator(".text-danger").filter({ hasText: /.+/ });
  }

  async goto() {
    await this.page.goto("/login");
    await this.page.waitForLoadState("domcontentloaded");
  }

  async login(username, password) {
    // กรณี username/password ว่าง — ปุ่ม submit จะ disabled (required)
    // กรอกตามที่ส่งมา แล้วพยายามกด (ถ้าปุ่มไม่ได้ disabled)
    if (username) await this.usernameInput.fill(username);
    if (password) await this.passwordInput.fill(password);

    const isDisabled = await this.submitButton.isDisabled();
    if (!isDisabled) {
      await this.submitButton.click();
    }
  }

  async loginFull(username, password) {
    // เวอร์ชันสำหรับ setup: กรอกทั้งคู่แล้วรอ submit เสร็จ
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectRedirectToAdmin(timeout = 8_000) {
    await this.page.waitForURL(/\/admin/, { timeout });
  }

  async expectStayOnLogin() {
    // รอ 2 วินาที — ถ้ายังอยู่หน้า login ถือว่า login ล้มเหลวถูกต้อง
    await this.page.waitForTimeout(2_000);
    const url = this.page.url();
    if (url.includes("/admin")) {
      throw new Error(`Expected login to fail, but redirected to admin (url: ${url})`);
    }
  }
}
