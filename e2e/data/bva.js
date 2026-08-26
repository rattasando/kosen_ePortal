/**
 * bva.js — Boundary Value Analysis utilities
 * ─────────────────────────────────────────────────────────────
 * สร้าง test data ตามหลัก BVA:
 *   - min boundary    : 0 หรือค่าต่ำสุดที่ valid
 *   - min + 1         : หนึ่งเหนือ min
 *   - max - 1         : หนึ่งก่อนถึง max
 *   - max (on-point)  : ค่าสูงสุดที่ valid
 *   - max + 1 (off)   : เกิน limit → ต้องถูก reject
 *
 * VarChar limits อ้างอิงจาก prisma/schema.prisma @db.VarChar(n)
 */

// ── String generators ──────────────────────────────────────────

/** สร้าง string ยาว `n` ตัวอักษรด้วย char ที่กำหนด */
export const str = (n, char = "a") => char.repeat(n);

/** สร้าง string ภาษาไทยยาว `n` ตัวอักษร */
export const thStr = (n) => "ก".repeat(n);

/** สร้าง email ที่ local part ยาว `localLen` ตัวอักษร */
export const emailOf = (localLen, domain = "test.com") =>
  `${"a".repeat(localLen)}@${domain}`;

// ── BVA point factory ─────────────────────────────────────────

/**
 * คืน object ที่มี 5 boundary points สำหรับ VarChar(n)
 *
 * @param {number} max  — VarChar limit (เช่น 100)
 * @param {string} [char] — character ที่ใช้เติม (default "a")
 * @returns {{ zero, min1, belowMax, onMax, aboveMax }}
 */
export function bvaStr(max, char = "a") {
  return {
    zero:     "",
    min1:     str(1, char),
    belowMax: str(max - 1, char),
    onMax:    str(max, char),
    aboveMax: str(max + 1, char),
  };
}

/**
 * คืน BVA points แบบไทย สำหรับ VarChar(n)
 */
export function bvaThai(max) {
  return bvaStr(max, "ก");
}

// ── Domain-specific limits (จาก schema.prisma) ───────────────

/**
 * ค่า VarChar limit จาก schema จริง — อ้างอิงจาก prisma/schema.prisma
 * หมายเหตุ:
 *   note     → Text ไม่มี VarChar limit (ไม่มีใน LIMITS)
 *   avatar   → VarChar(500)
 *   faq question/answer → Text ไม่มี VarChar limit
 */
export const LIMITS = {
  // Student
  studentId:   20,
  name:       100,
  lastname:   100,
  nickname:    50,
  nationalId:  20,
  passport:    20,
  tel:         20,
  email:      150,
  lineId:     100,
  country:     50,
  avatar:     500,   // ← VarChar(500) ไม่ใช่ note
  status:      30,
  // Enrollment
  university:  200,  // VarChar(200)
  faculty:     100,
  department:  100,
  major:       100,
  // News
  newsTitle:   200,
  // FAQ category: VarChar(50) จาก schema จริง
  faqCategory:  50,
};

// ── Pre-built BVA sets ────────────────────────────────────────

/** BVA set สำหรับชื่อนักเรียน (VarChar 100) */
export const NAME_BVA = bvaStr(LIMITS.name);

/** BVA set สำหรับ nationalId (VarChar 20) */
export const NATIONAL_ID_BVA = bvaStr(LIMITS.nationalId, "0");

/** BVA set สำหรับ email (VarChar 150) */
export const EMAIL_BVA = {
  zero:     "",
  min1:     "a@b.c",
  valid:    "student@kosen.ac.th",
  belowMax: emailOf(LIMITS.email - "@test.com".length - 1),
  onMax:    emailOf(LIMITS.email - "@test.com".length),
  aboveMax: emailOf(LIMITS.email - "@test.com".length + 1),
};

/** BVA set สำหรับ avatar (VarChar 500) */
export const AVATAR_BVA = bvaStr(LIMITS.avatar);
