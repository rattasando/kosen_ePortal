import { describe, it, expect } from "vitest";
import {
  ALUMNI_VARCHAR_LIMITS,
  EMPLOYMENT_VARCHAR_LIMITS,
  findTooLongFields,
  describeTooLongFields,
} from "@/lib/utils/alumniFieldLimits";

describe("ALUMNI_VARCHAR_LIMITS", () => {
  it("มี field หลักครบ", () => {
    expect(ALUMNI_VARCHAR_LIMITS).toHaveProperty("name");
    expect(ALUMNI_VARCHAR_LIMITS).toHaveProperty("lastname");
    expect(ALUMNI_VARCHAR_LIMITS).toHaveProperty("university");
    expect(ALUMNI_VARCHAR_LIMITS).toHaveProperty("phone");
  });

  it("ทุก value เป็น number > 0", () => {
    for (const [field, max] of Object.entries(ALUMNI_VARCHAR_LIMITS)) {
      expect(max, `${field} ควรเป็น number > 0`).toBeGreaterThan(0);
    }
  });
});

describe("EMPLOYMENT_VARCHAR_LIMITS", () => {
  it("มี field หลักของประวัติการทำงานครบ", () => {
    expect(EMPLOYMENT_VARCHAR_LIMITS).toHaveProperty("company");
    expect(EMPLOYMENT_VARCHAR_LIMITS).toHaveProperty("position");
  });

  it("ทุก value เป็น number > 0", () => {
    for (const [field, max] of Object.entries(EMPLOYMENT_VARCHAR_LIMITS)) {
      expect(max, `${field} ควรเป็น number > 0`).toBeGreaterThan(0);
    }
  });
});

// ── findTooLongFields (alumni) ────────────────────────────────
describe("findTooLongFields (alumni)", () => {
  it("ไม่มี field เกิน → คืน array ว่าง", () => {
    const data = { name: "สมชาย", phone: "0812345678" };
    expect(findTooLongFields(data, ALUMNI_VARCHAR_LIMITS)).toEqual([]);
  });

  it("field เกิน limit → รายงาน field นั้น", () => {
    const data = { name: "ก".repeat(101) }; // เกิน 100
    const errors = findTooLongFields(data, ALUMNI_VARCHAR_LIMITS);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe("name");
    expect(errors[0].length).toBeGreaterThan(100);
  });

  it("data เป็น null → คืน array ว่าง ไม่ crash", () => {
    expect(findTooLongFields(null, ALUMNI_VARCHAR_LIMITS)).toEqual([]);
  });

  it("data เป็น undefined → คืน array ว่าง ไม่ crash", () => {
    expect(findTooLongFields(undefined, ALUMNI_VARCHAR_LIMITS)).toEqual([]);
  });

  it("ค่าเป็น null/number → ไม่นับว่าเกิน", () => {
    const data = { name: null, phone: 12345 };
    expect(findTooLongFields(data, ALUMNI_VARCHAR_LIMITS)).toEqual([]);
  });
});

// ── describeTooLongFields (alumni) ───────────────────────────
describe("describeTooLongFields (alumni)", () => {
  it("array ว่าง → คืน string ว่าง", () => {
    expect(describeTooLongFields([])).toBe("");
  });

  it("มี error → แสดง field + ความยาว", () => {
    const errors = [{ field: "name", length: 150, max: 100 }];
    const result = describeTooLongFields(errors);
    expect(result).toContain("name");
    expect(result).toContain("150");
    expect(result).toContain("100");
  });
});
