import { describe, it, expect } from "vitest";
import { prepEnrollments } from "@/lib/utils/studentEnrollments";

describe("prepEnrollments", () => {
  const baseEnrollment = {
    id: "enr-001",
    studentId: "std-001",
    order: 99, // ค่าเดิมต้องถูกเขียนทับ
    university: "KMUTT",
    faculty: "Engineering",
    major: "CS",
    startDate: "2021-04-01",
    endDate: null,
  };

  it("บังคับ order ตามตำแหน่งใน array (เริ่มที่ 1)", () => {
    const result = prepEnrollments([baseEnrollment]);
    expect(result[0].order).toBe(1);
  });

  it("หลาย enrollment — order เรียงตามตำแหน่ง", () => {
    const enrollments = [
      { ...baseEnrollment, order: 5 },
      { ...baseEnrollment, id: "enr-002", order: 3 },
    ];
    const result = prepEnrollments(enrollments);
    expect(result[0].order).toBe(1);
    expect(result[1].order).toBe(2);
  });

  it("strip id, studentId, order เดิมออก", () => {
    const result = prepEnrollments([baseEnrollment]);
    expect(result[0].id).toBeUndefined();
    expect(result[0].studentId).toBeUndefined();
    // order ใหม่ถูก set — ไม่ใช่ค่า 99 เดิม
    expect(result[0].order).not.toBe(99);
  });

  it("แปลง startDate string → Date object", () => {
    const result = prepEnrollments([baseEnrollment]);
    expect(result[0].startDate).toBeInstanceOf(Date);
    expect(result[0].startDate.getFullYear()).toBe(2021);
  });

  it("endDate null = สถาบันปัจจุบัน — คงเป็น null", () => {
    const result = prepEnrollments([baseEnrollment]);
    expect(result[0].endDate).toBeNull();
  });

  it("endDate มีค่า → แปลงเป็น Date object", () => {
    const withEnd = { ...baseEnrollment, endDate: "2024-03-31" };
    const result = prepEnrollments([withEnd]);
    expect(result[0].endDate).toBeInstanceOf(Date);
    expect(result[0].endDate.getFullYear()).toBe(2024);
  });

  it("startDate ว่าง → null", () => {
    const noStart = { ...baseEnrollment, startDate: null };
    const result = prepEnrollments([noStart]);
    expect(result[0].startDate).toBeNull();
  });

  it("array ว่าง → คืน array ว่าง", () => {
    expect(prepEnrollments([])).toEqual([]);
  });

  it("คง field อื่นๆ ไว้ครบ", () => {
    const result = prepEnrollments([baseEnrollment]);
    expect(result[0].university).toBe("KMUTT");
    expect(result[0].faculty).toBe("Engineering");
    expect(result[0].major).toBe("CS");
  });
});
