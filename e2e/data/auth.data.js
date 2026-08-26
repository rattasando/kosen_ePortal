/**
 * auth.data.js — Test data สำหรับ authentication
 * ─────────────────────────────────────────────────────────────
 * อ้างอิง seed users จาก lib/data/userData.js
 * Default password ทุกคน: Kosen@2024!
 * ยกเว้น superadmin: admin / admin
 */

export const ADMIN_USER = {
  username: "admin",
  password: "admin",
  displayName: "Super Admin",
};

export const NORMAL_USER = {
  username: "kosen_staff",
  password: "Kosen@2024!",
};

/** BVA cases สำหรับ login form */
export const LOGIN_CASES = [
  // ── Valid ──────────────────────────────────────────────────
  {
    id: "valid-admin",
    label: "admin login — ถูกต้อง",
    username: ADMIN_USER.username,
    password: ADMIN_USER.password,
    expect: "success",
  },

  // ── Invalid credentials ────────────────────────────────────
  {
    id: "wrong-password",
    label: "password ผิด",
    username: ADMIN_USER.username,
    password: "wrongpassword",
    expect: "error",
  },
  {
    id: "wrong-username",
    label: "username ไม่มีในระบบ",
    username: "nonexistentuser",
    password: "Kosen@2024!",
    expect: "error",
  },

  // ── Boundary: empty fields ────────────────────────────────
  {
    id: "empty-both",
    label: "username และ password ว่างทั้งคู่",
    username: "",
    password: "",
    expect: "error",
  },
  {
    id: "empty-username",
    label: "username ว่าง",
    username: "",
    password: "Kosen@2024!",
    expect: "error",
  },
  {
    id: "empty-password",
    label: "password ว่าง",
    username: ADMIN_USER.username,
    password: "",
    expect: "error",
  },
];
