import { describe, it, expect } from "vitest";
import {
  ALUMNI_FIELD_LABELS,
  diffAlumniSnapshot,
  buildAlumniSummary,
  formatHistoryDate,
} from "@/lib/utils/alumniHistoryHelpers";

// ── ALUMNI_FIELD_LABELS ────────────────────────────────────────
describe("ALUMNI_FIELD_LABELS", () => {
  it("มี field หลักครบ", () => {
    expect(ALUMNI_FIELD_LABELS).toHaveProperty("name");
    expect(ALUMNI_FIELD_LABELS).toHaveProperty("lastname");
    expect(ALUMNI_FIELD_LABELS).toHaveProperty("university");
  });
});

// ── diffAlumniSnapshot ────────────────────────────────────────
describe("diffAlumniSnapshot", () => {
  it("ไม่มีการเปลี่ยนแปลง → คืน array ว่าง", () => {
    const snap = { name: "สมชาย", lastname: "ใจดี" };
    expect(diffAlumniSnapshot(snap, snap)).toEqual([]);
  });

  it("เปลี่ยนชื่อ → detect 1 change", () => {
    const before = { name: "สมชาย" };
    const after  = { name: "สมหญิง" };
    const changes = diffAlumniSnapshot(before, after);
    expect(changes).toHaveLength(1);
    expect(changes[0].field).toBe("name");
    expect(changes[0].before).toBe("สมชาย");
    expect(changes[0].after).toBe("สมหญิง");
  });

  it("field ที่ไม่อยู่ใน ALUMNI_FIELD_LABELS → ไม่รวมใน changes", () => {
    const before = { name: "สมชาย", studentId: "STD001" };
    const after  = { name: "สมหญิง", studentId: "STD002" };
    const changes = diffAlumniSnapshot(before, after);
    expect(changes.every((c) => c.field !== "studentId")).toBe(true);
  });

  it("ค่าเปลี่ยนเป็น empty → แสดง '—' แทน", () => {
    const before = { nickname: "เก่ง" };
    const after  = { nickname: "" };
    const changes = diffAlumniSnapshot(before, after);
    expect(changes).toHaveLength(1);
    expect(changes[0].after).toBe("—");
  });

  // employmentHistory diff
  it("เพิ่ม employment → detect count change", () => {
    const before = { employmentHistory: [] };
    const after  = { employmentHistory: [{ company: "บริษัท A", position: "Dev" }] };
    const changes = diffAlumniSnapshot(before, after);
    const countChange = changes.find((c) => c.field === "employmentHistory.count");
    expect(countChange).toBeDefined();
  });

  it("เปลี่ยน company ใน employment → detect field change", () => {
    const emp = { company: "บริษัท A", position: "Dev", startDate: "", endDate: "", location: "", type: "" };
    const before = { employmentHistory: [emp] };
    const after  = { employmentHistory: [{ ...emp, company: "บริษัท B" }] };
    const changes = diffAlumniSnapshot(before, after);
    expect(changes.some((c) => c.field.includes("company"))).toBe(true);
  });

  it("ค่า null/undefined ใน employment field → แสดง '—'", () => {
    const before = { employmentHistory: [{ company: null, position: "Dev", startDate: null, endDate: null, location: null, type: null }] };
    const after  = { employmentHistory: [{ company: "บริษัท B", position: "Dev", startDate: null, endDate: null, location: null, type: null }] };
    const changes = diffAlumniSnapshot(before, after);
    const companyChange = changes.find((c) => c.field.includes("company"));
    expect(companyChange?.before).toBe("—");
  });

  it("employment array เหมือนกัน → ไม่มี change", () => {
    const emp = { company: "A", position: "Dev", startDate: "", endDate: "", location: "", type: "" };
    const snap = { employmentHistory: [emp] };
    expect(diffAlumniSnapshot(snap, snap)).toEqual([]);
  });

  it("before/after เป็น null/undefined → ไม่ crash", () => {
    expect(() => diffAlumniSnapshot(null, { name: "สมชาย" })).not.toThrow();
    expect(() => diffAlumniSnapshot({ name: "สมชาย" }, null)).not.toThrow();
    expect(() => diffAlumniSnapshot(null, null)).not.toThrow();
  });
});

// ── buildAlumniSummary ────────────────────────────────────────
describe("buildAlumniSummary", () => {
  it("type = create → ข้อความสร้างใหม่", () => {
    expect(buildAlumniSummary("create", [])).toBe("สร้างข้อมูลศิษย์เก่าใหม่");
  });

  it("type = delete → ข้อความลบ", () => {
    expect(buildAlumniSummary("delete", [])).toBe("ลบข้อมูลศิษย์เก่า");
  });

  it("ไม่มี changes → 'บันทึกข้อมูล (ไม่มีการเปลี่ยนแปลง)'", () => {
    expect(buildAlumniSummary("update", [])).toBe("บันทึกข้อมูล (ไม่มีการเปลี่ยนแปลง)");
  });

  it("1 change → แสดง before → after", () => {
    const changes = [{ field: "name", label: "ชื่อ", before: "สมชาย", after: "สมหญิง" }];
    expect(buildAlumniSummary("update", changes)).toBe("แก้ไข ชื่อ: สมชาย → สมหญิง");
  });

  it("หลาย changes → แสดงจำนวน + รายชื่อ field", () => {
    const changes = [
      { field: "name",     label: "ชื่อ",     before: "ก", after: "ข" },
      { field: "lastname", label: "นามสกุล", before: "ก", after: "ข" },
    ];
    const summary = buildAlumniSummary("update", changes);
    expect(summary).toContain("2");
    expect(summary).toContain("ชื่อ");
  });
});

// ── formatHistoryDate ─────────────────────────────────────────
describe("formatHistoryDate", () => {
  it("คืนค่าเป็น string ที่ไม่ว่าง", () => {
    const result = formatHistoryDate("2024-06-15T10:30:00.000Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});
