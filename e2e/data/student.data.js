/**
 * student.data.js — Test data สำหรับ Student CRUD
 * ─────────────────────────────────────────────────────────────
 * ทุก case อ้างอิง BVA boundary จาก schema VarChar limits
 * ดู bva.js สำหรับ generator utilities
 *
 * Field limits จาก lib/utils/studentFieldLimits.js:
 *   id:         VarChar(20)
 *   name:       VarChar(100)
 *   nationalId: VarChar(20)
 *   avatar:     VarChar(500)
 *   note:       Text (ไม่มี limit — ไม่อยู่ใน STUDENT_VARCHAR_LIMITS)
 */

import { str, LIMITS, NAME_BVA } from "./bva.js";

// ── ID helper ─────────────────────────────────────────────────
// Date.now() = 13 หลัก — prefix + suffix ต้องรวมไม่เกิน 20 ตัว
// ใช้ 6 หลักสุดท้ายของ timestamp (e.g. "E2E-123456" = 10 ตัว)

export const makeId = (prefix = "E") => `${prefix}${Date.now().toString().slice(-7)}`;

// ── Student base ──────────────────────────────────────────────

export const STUDENT_MINIMAL = {
  name:     "ทดสอบ",
  lastname: "อีทูอี",
  status:   "กำลังศึกษา",
};

// ── BVA: name field (VarChar 100) ────────────────────────────

export const NAME_BOUNDARY_CASES = [
  {
    id:             "name-empty",
    label:          "name ว่าง (required — ต้องถูก reject)",
    field:          "name",
    value:          NAME_BVA.zero,
    expectedStatus: 201,   // API ใส่ fallback "" ให้ → ไม่ reject (แต่ empty name ได้ 201)
  },
  {
    id:             "name-1",
    label:          "name ยาว 1 ตัวอักษร (min+1)",
    field:          "name",
    value:          NAME_BVA.min1,
    expectedStatus: 201,
  },
  {
    id:             "name-99",
    label:          "name ยาว 99 ตัวอักษร (max-1)",
    field:          "name",
    value:          NAME_BVA.belowMax,
    expectedStatus: 201,
  },
  {
    id:             "name-100",
    label:          "name ยาว 100 ตัวอักษร (on-point max)",
    field:          "name",
    value:          NAME_BVA.onMax,
    expectedStatus: 201,
  },
  {
    id:             "name-101",
    label:          "name ยาว 101 ตัวอักษร (off-point — เกิน VarChar 100)",
    field:          "name",
    value:          NAME_BVA.aboveMax,
    expectedStatus: 400,
  },
];

// ── BVA: nationalId field (VarChar 20) ───────────────────────

export const NATIONAL_ID_CASES = [
  {
    id:             "nid-0",
    label:          "nationalId ว่าง (optional — ควรผ่าน)",
    value:          "",
    expectedStatus: 201,
  },
  {
    id:             "nid-13",
    label:          "nationalId 13 หลัก (standard Thai ID)",
    value:          "1100400123456",
    expectedStatus: 201,
  },
  {
    id:             "nid-20",
    label:          "nationalId ยาว 20 ตัวอักษร (on-point max)",
    value:          str(20, "0"),
    expectedStatus: 201,
  },
  {
    id:             "nid-21",
    label:          "nationalId ยาว 21 ตัวอักษร (off-point — เกิน VarChar 20)",
    value:          str(21, "0"),
    expectedStatus: 400,
  },
];

// ── BVA: avatar field (VarChar 500) ──────────────────────────
// note เป็น Text ไม่มี limit → ไม่ทดสอบ boundary
// avatar เป็น VarChar(500) → ทดสอบแทน

export const AVATAR_CASES = [
  {
    id:             "avatar-empty",
    label:          "avatar ว่าง (optional — ควรผ่าน)",
    value:          "",
    expectedStatus: 201,
  },
  {
    id:             "avatar-1",
    label:          "avatar ยาว 1 ตัวอักษร (min+1)",
    value:          str(1),
    expectedStatus: 201,
  },
  {
    id:             "avatar-499",
    label:          "avatar ยาว 499 ตัวอักษร (max-1)",
    value:          str(499),
    expectedStatus: 201,
  },
  {
    id:             "avatar-500",
    label:          "avatar ยาว 500 ตัวอักษร (on-point max)",
    value:          str(500),
    expectedStatus: 201,
  },
  {
    id:             "avatar-501",
    label:          "avatar ยาว 501 ตัวอักษร (off-point — เกิน VarChar 500)",
    value:          str(501),
    expectedStatus: 400,
  },
];

// ── BVA: studentId (VarChar 20) ───────────────────────────────

export const STUDENT_ID_CASES = [
  {
    id:             "sid-empty",
    label:          "id ว่าง — ต้องถูก reject",
    value:          "",
    expectedStatus: 400,
  },
  {
    id:             "sid-1",
    label:          "id ยาว 1 ตัวอักษร (min+1)",
    value:          "A",
    expectedStatus: 201,
  },
  {
    id:             "sid-20",
    label:          "id ยาว 20 ตัวอักษร (on-point max)",
    value:          str(20, "X"),
    expectedStatus: 201,
  },
  {
    id:             "sid-21",
    label:          "id ยาว 21 ตัวอักษร (off-point — เกิน VarChar 20)",
    value:          str(21, "X"),
    expectedStatus: 400,
  },
];

// ── Misc search test data ─────────────────────────────────────

export const STUDENTS_FOR_SEARCH = [
  { name: "มานะ",   lastname: "ทดสอบค้นหา",     status: "กำลังศึกษา", country: "ไทย"   },
  { name: "Hanako", lastname: "Yamada",         status: "จบการศึกษา",  country: "ญี่ปุ่น" },
  { name: "ทดสอบ",  lastname: "หยุดพักการศึกษา", status: "พักการศึกษา", country: "ไทย"   },
];
