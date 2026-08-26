/**
 * faq.data.js — Test data สำหรับ FAQ CRUD
 * ─────────────────────────────────────────────────────────────
 * VarChar limits จาก schema จริง (prisma/schema.prisma):
 *   id:       VarChar(20)
 *   category: VarChar(50)   ← ไม่ใช่ 100!
 *   question, answer: String (Text — ไม่มี VarChar limit)
 */

import { str, bvaStr } from "./bva.js";

// ── BVA set สำหรับ category (VarChar 50) ─────────────────────

export const CATEGORY_BVA = bvaStr(50);

// ── FAQ base ──────────────────────────────────────────────────

export const FAQ_VALID = {
  question: "การสมัครทุนการศึกษาต้องทำอย่างไร?",
  answer:   "ยื่นเอกสารที่ฝ่ายวิชาการพร้อมผลการเรียนเฉลี่ยไม่ต่ำกว่า 3.00",
  category: "ทุนการศึกษา",
  status:   "published",
};

// ── BVA: question field (Text — ไม่มี VarChar limit) ──────────
// หมายเหตุ: question="" → Prisma รับ empty string (ไม่ใช่ null) → 201

export const QUESTION_CASES = [
  {
    id:             "q-empty",
    label:          "question ว่าง (Text — Prisma รับ empty string → 201)",
    question:       "",
    answer:         FAQ_VALID.answer,
    expectedStatus: 201,
  },
  {
    id:             "q-1",
    label:          "question ยาว 1 ตัวอักษร (min+1)",
    question:       "?",
    answer:         FAQ_VALID.answer,
    expectedStatus: 201,
  },
  {
    id:             "q-long",
    label:          "question ยาว 500 ตัวอักษร (long but valid — Text field)",
    question:       str(500, "ก"),
    answer:         FAQ_VALID.answer,
    expectedStatus: 201,
  },
];

// ── BVA: category field (VarChar 50) ─────────────────────────

export const CATEGORY_CASES = [
  {
    id:             "cat-empty",
    label:          "category ว่าง (optional)",
    category:       "",
    expectedStatus: 201,
  },
  {
    id:             "cat-1",
    label:          "category ยาว 1 ตัวอักษร (min+1)",
    category:       CATEGORY_BVA.min1,
    expectedStatus: 201,
  },
  {
    id:             "cat-49",
    label:          "category ยาว 49 ตัวอักษร (max-1)",
    category:       CATEGORY_BVA.belowMax,   // str(49)
    expectedStatus: 201,
  },
  {
    id:             "cat-50",
    label:          "category ยาว 50 ตัวอักษร (on-point max)",
    category:       CATEGORY_BVA.onMax,      // str(50)
    expectedStatus: 201,
  },
  {
    id:             "cat-51",
    label:          "category ยาว 51 ตัวอักษร (off-point — เกิน VarChar 50)",
    category:       CATEGORY_BVA.aboveMax,   // str(51)
    expectedStatus: 400,
  },
];

// ── FAQ สำหรับ filter / status test ──────────────────────────

export const FAQS_FOR_FILTER = [
  { question: "คำถาม published", answer: "ตอบ 1", category: "ทั่วไป", status: "published" },
  { question: "คำถาม draft",     answer: "ตอบ 2", category: "ทั่วไป", status: "draft"     },
  { question: "คำถาม ทุน",       answer: "ตอบ 3", category: "ทุน",     status: "published" },
];
