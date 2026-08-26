/**
 * StudentListPage.js — POM สำหรับหน้า /admin/students/list
 */

export class StudentListPage {
  constructor(page) {
    this.page = page;

    // Locators
    this.searchInput     = page.getByPlaceholder(/ค้นหา/i).first();
    this.addButton       = page.getByRole("link", { name: /เพิ่มนักเรียน/i })
      .or(page.getByRole("button", { name: /เพิ่มนักเรียน/i }));
    this.tableRows       = page.locator("table tbody tr");
    this.statusPills     = page.locator("button[data-status], button").filter({ hasText: /ทั้งหมด|กำลังศึกษา|จบการศึกษา/ });
    this.paginationInfo  = page.locator("[data-testid='pagination-info'], .text-muted").filter({ hasText: /รายการ/ });
  }

  async goto() {
    await this.page.goto("/admin/students/list");
    await this.page.waitForLoadState("networkidle");
  }

  async search(query) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(400); // debounce
  }

  async clearSearch() {
    await this.searchInput.clear();
    await this.page.waitForTimeout(400);
  }

  async getRowCount() {
    return this.tableRows.count();
  }

  async clickRow(index = 0) {
    await this.tableRows.nth(index).click();
  }

  async filterByStatus(statusLabel) {
    await this.page.getByRole("button", { name: statusLabel }).click();
    await this.page.waitForTimeout(300);
  }
}
