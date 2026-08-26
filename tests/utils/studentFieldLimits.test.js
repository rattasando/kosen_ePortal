import { describe, it, expect } from "vitest";
import {
  STUDENT_ID_LIMIT,
  STUDENT_VARCHAR_LIMITS,
  ENROLLMENT_VARCHAR_LIMITS,
  findTooLongFields,
  describeTooLongFields,
} from "@/lib/utils/studentFieldLimits";

// ── constants ─────────────────────────────────────────────────
describe("STUDENT_ID_LIMIT", () => {
  it("เป็น number ที่มากกว่า 0", () => {
    expect(typeof STUDENT_ID_LIMIT).toBe("number");
    expect(STUDENT_ID_LIMIT).toBeGreaterThan(0);
  });
});

describe("STUDENT_VARCHAR_LIMITS", () => {
  it("มี field หลักครบ", () => {
    expect(STUDENT_VARCHAR_LIMITS).toHaveProperty("name");
    expect(STUDENT_VARCHAR_LIMITS).toHaveProperty("lastname");
    expect(STUDENT_VARCHAR_LIMITS).toHaveProperty("nationalId");
    expect(STUDENT_VARCHAR_LIMITS).toHaveProperty("email");
  });

  it("ทุก value เป็น number > 0", () => {
    for (const [field, max] of Object.entries(STUDENT_VARCHAR_LIMITS)) {
      expect(max, `${field} ควรเป็น number > 0`).toBeGreaterThan(0);
    }
  });
});

describe("ENROLLMENT_VARCHAR_LIMITS", () => {
  it("มี field หลักครบ", () => {
    expect(ENROLLMENT_VARCHAR_LIMITS).toHaveProperty("university");
    expect(ENROLLMENT_VARCHAR_LIMITS).toHaveProperty("major");
    expect(ENROLLMENT_VARCHAR_LIMITS).toHaveProperty("faculty");
  });
});

// ── findTooLongFields ─────────────────────────────────────────
describe("findTooLongFields", () => {
  const limits = { name: 10, email: 50 };

  it("ไม่มี field เกิน → คืน array ว่าง", () => {
    const data = { name: "สมชาย", email: "a@b.com" };
    expect(findTooLongFields(data, limits)).toEqual([]);
  });

  it("field เกิน → ระบุ field + ความยาวจริง + ความยาว max", () => {
    const data = { name: "ชื่อยาวเกินสิบอักขระแน่นอน" };
    const errors = findTooLongFields(data, limits);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe("name");
    expect(errors[0].max).toBe(10);
    expect(errors[0].length).toBeGreaterThan(10);
  });

  it("หลาย field เกิน → รายงานครบทุก field", () => {
    const data = {
      name:  "x".repeat(20), // เกิน 10
      email: "x".repeat(60), // เกิน 50
    };
    const errors = findTooLongFields(data, limits);
    expect(errors).toHaveLength(2);
    const fields = errors.map((e) => e.field);
    expect(fields).toContain("name");
    expect(fields).toContain("email");
  });

  it("ค่าเป็น null/undefined → ไม่นับว่าเกิน", () => {
    const data = { name: null, email: undefined };
    expect(findTooLongFields(data, limits)).toEqual([]);
  });

  it("ค่าเป็น number → ไม่นับว่าเกิน (เช็คเฉพาะ string)", () => {
    const data = { name: 12345 };
    expect(findTooLongFields(data, limits)).toEqual([]);
  });

  it("data เป็น null → คืน array ว่าง ไม่ crash", () => {
    expect(findTooLongFields(null, limits)).toEqual([]);
  });

  it("data เป็น undefined → คืน array ว่าง ไม่ crash", () => {
    expect(findTooLongFields(undefined, limits)).toEqual([]);
  });

  it("ใช้กับ STUDENT_VARCHAR_LIMITS จริงได้", () => {
    const data = { name: "a".repeat(101) }; // เกิน limit 100
    const errors = findTooLongFields(data, STUDENT_VARCHAR_LIMITS);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe("name");
  });

  it("พอดี limit → ไม่นับว่าเกิน", () => {
    const data = { name: "a".repeat(10) }; // พอดี 10
    expect(findTooLongFields(data, limits)).toEqual([]);
  });

  it("เกินแค่ 1 ตัว → นับว่าเกิน", () => {
    const data = { name: "a".repeat(11) }; // เกิน 10 ไป 1
    const errors = findTooLongFields(data, limits);
    expect(errors).toHaveLength(1);
  });
});

// ── describeTooLongFields ─────────────────────────────────────
describe("describeTooLongFields", () => {
  it("array ว่าง → คืน string ว่าง", () => {
    expect(describeTooLongFields([])).toBe("");
  });

  it("1 error → แสดง field + ความยาวจริง / max", () => {
    const errors = [{ field: "name", length: 150, max: 100 }];
    const result = describeTooLongFields(errors);
    expect(result).toContain("name");
    expect(result).toContain("150");
    expect(result).toContain("100");
  });

  it("หลาย error → คั่นด้วย comma", () => {
    const errors = [
      { field: "name",  length: 150, max: 100 },
      { field: "email", length: 200, max: 150 },
    ];
    const result = describeTooLongFields(errors);
    expect(result).toContain("name");
    expect(result).toContain("email");
    expect(result).toContain(",");
  });
});
