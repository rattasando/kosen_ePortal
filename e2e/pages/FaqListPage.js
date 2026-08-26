/**
 * FaqListPage.js — POM สำหรับหน้า /admin/information/faq
 */

export class FaqListPage {
  constructor(page) {
    this.page = page;

    // Locators
    this.searchInput = page.getByPlaceholder(/ค้นหา/i).first();
    this.addButton   = page.getByRole("button", { name: /เพิ่ม/i }).first();
    this.tableRows   = page.locator("table tbody tr");
    this.statusPills = page.locator("button").filter({ hasText: /ทั้งหมด|เผยแพร่|แบบร่าง/ });
  }

  async goto() {
    await this.page.goto("/admin/information/faq");
    await this.page.waitForLoadState("networkidle");
  }

  async search(query) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(400);
  }

  async getRowCount() {
    return this.tableRows.count();
  }

  async filterByStatus(label) {
    await this.page.getByRole("button", { name: label }).click();
    await this.page.waitForTimeout(300);
  }

  /** คลิกปุ่ม Edit ของแถวที่ index */
  async clickEdit(index = 0) {
    await this.tableRows.nth(index).getByRole("button", { name: /แก้ไข|edit/i }).click();
  }
}
