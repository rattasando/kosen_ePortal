/**
 * StudentFormPage.js — Page Object for /admin/students/new
 * และ /admin/students/[id]/edit
 */

export class StudentFormPage {
  constructor(page) {
    this.page = page;
    // Required fields
    this.nameInput        = page.getByPlaceholder("สมชาย");
    this.lastnameInput    = page.getByPlaceholder("ประเสริฐ");
    this.telInput         = page.getByPlaceholder("081-234-5678");
    this.emailInput       = page.getByPlaceholder("student@kosen.ac.th");
    this.universityInput  = page.getByPlaceholder("ชื่อมหาวิทยาลัย...");
    this.submitButton     = page.getByRole("button", { name: "บันทึกข้อมูล" });
  }

  async gotoNew() {
    await this.page.goto("/admin/students/new");
  }

  /**
   * กรอกฟอร์มขั้นต่ำที่ isValid pass:
   *   name + lastname + university + tel + email
   */
  async fillMinimum({ name, lastname, university, tel, email }) {
    await this.nameInput.fill(name);
    await this.lastnameInput.fill(lastname);
    await this.universityInput.fill(university);
    await this.telInput.fill(tel);
    await this.emailInput.fill(email);
  }

  async submit() {
    await this.submitButton.click();
  }

  /** รอหน้า success หลัง submit (URL เปลี่ยนหรือ element ปรากฏ) */
  async expectSuccess() {
    // หลัง save สำเร็จ จะแสดงปุ่ม "เพิ่มนักเรียนใหม่" หรือ redirect
    await this.page.waitForSelector(
      'text="บันทึกข้อมูลเรียบร้อย"',
      { timeout: 10_000 },
    ).catch(() =>
      // fallback: ตรวจว่า URL ไม่ได้ stay at /new อีกต่อไป
      this.page.waitForFunction(
        () => !window.location.pathname.endsWith("/new"),
        { timeout: 10_000 },
      )
    );
  }
}
