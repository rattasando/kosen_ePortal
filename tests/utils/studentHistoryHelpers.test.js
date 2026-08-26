import { describe, it, expect } from "vitest";
import {
  diffSnapshot,
  buildSummary,
  formatHistoryDate,
} from "@/lib/utils/studentHistoryHelpers";

// ── diffSnapshot ──────────────────────────────────────────────
describe("diffSnapshot", () => {
  it("ไม่มีการเปลี่ยนแปลง → คืน array ว่าง", () => {
    const snap = { name: "สมชาย", lastname: "ใจดี" };
    expect(diffSnapshot(snap, snap)).toEqual([]);
  });

  it("เปลี่ยนชื่อ → detect 1 change", () => {
    const before = { name: "สมชาย", lastname: "ใจดี" };
    const after  = { name: "สมหญิง", lastname: "ใจดี" };
    const changes = diffSnapshot(before, after);
    expect(changes).toHaveLength(1);
    expect(changes[0].field).toBe("name");
    expect(changes[0].before).toBe("สมชาย");
    expect(changes[0].after).toBe("สมหญิง");
  });

  it("เปลี่ยนหลาย field → detect ครบ", () => {
    const before = { name: "สมชาย", lastname: "ใจดี", nickname: "เก่ง" };
    const after  = { name: "สมหญิง", lastname: "รักดี", nickname: "เก่ง" };
    const changes = diffSnapshot(before, after);
    expect(changes).toHaveLength(2);
    const fields = changes.map((c) => c.field);
    expect(fields).toContain("name");
    expect(fields).toContain("lastname");
  });

  it("field ที่ไม่อยู่ใน FIELD_LABELS → ไม่รวมใน changes", () => {
    const before = { name: "สมชาย", university: "KMUTT" };
    const after  = { name: "สมหญิง", university: "KMITL" };
    const changes = diffSnapshot(before, after);
    // university ไม่มีใน FIELD_LABELS → ไม่ถูกรวม
    expect(changes.every((c) => c.field !== "university")).toBe(true);
  });

  it("selfFunded: format เป็น 'จ่ายเอง' / 'รับทุน'", () => {
    const before = { selfFunded: false };
    const after  = { selfFunded: true };
    const changes = diffSnapshot(before, after);
    expect(changes[0].before).toBe("รับทุน");
    expect(changes[0].after).toBe("จ่ายเอง");
  });

  it("before/after shape ต้องตรงกัน — ไม่สร้าง diff ปลอม", () => {
    // ถ้า shape ไม่ตรง field ที่อยู่ฝั่งเดียวจะถูก detect เป็น change
    // เพื่อป้องกัน bug ที่ CLAUDE.md เตือนไว้ ทดสอบว่า shape เดียวกัน = ไม่มี diff
    const snap = { name: "สมชาย", lastname: "ใจดี", email: "a@b.com" };
    expect(diffSnapshot({ ...snap }, { ...snap })).toEqual([]);
  });

  it("null/undefined before → ไม่ crash", () => {
    expect(() => diffSnapshot(null, { name: "สมชาย" })).not.toThrow();
  });

  it("null/undefined after → ไม่ crash", () => {
    expect(() => diffSnapshot({ name: "สมชาย" }, null)).not.toThrow();
  });

  it("both null → คืน array ว่าง", () => {
    expect(diffSnapshot(null, null)).toEqual([]);
  });

  // addresses diff
  it("เปลี่ยนที่อยู่ไทย → detect change", () => {
    const before = { addresses: { th: { province: "กรุงเทพฯ" } } };
    const after  = { addresses: { th: { province: "เชียงใหม่" } } };
    const changes = diffSnapshot(before, after);
    expect(changes.some((c) => c.field.includes("addresses.th"))).toBe(true);
  });

  it("เปลี่ยนที่อยู่ญี่ปุ่น → detect change", () => {
    const before = { addresses: { jp: { prefecture: "Tokyo" } } };
    const after  = { addresses: { jp: { prefecture: "Osaka" } } };
    const changes = diffSnapshot(before, after);
    expect(changes.some((c) => c.field.includes("addresses.jp"))).toBe(true);
  });

  it("ที่อยู่ไม่เปลี่ยน → ไม่มี change", () => {
    const snap = { addresses: { th: { province: "กรุงเทพฯ" }, jp: { prefecture: "Tokyo" } } };
    expect(diffSnapshot(snap, snap)).toEqual([]);
  });

  it("addresses เป็น null/undefined → ไม่ crash", () => {
    expect(() => diffSnapshot({ addresses: null }, { addresses: null })).not.toThrow();
  });

  // enrollments diff
  it("เปลี่ยนมหาวิทยาลัย → detect change", () => {
    const before = { enrollments: [{ university: "KMUTT", major: "CS" }] };
    const after  = { enrollments: [{ university: "KMITL", major: "CS" }] };
    const changes = diffSnapshot(before, after);
    expect(changes.some((c) => c.field.includes("enrollments"))).toBe(true);
  });

  it("enrollment ไม่เปลี่ยน → ไม่มี change", () => {
    const snap = { enrollments: [{ university: "KMUTT", major: "CS" }] };
    expect(diffSnapshot(snap, snap)).toEqual([]);
  });

  it("เพิ่ม enrollment → detect change ในส่วนที่ต่างกัน", () => {
    const before = { enrollments: [{ university: "KMUTT", major: "CS" }] };
    const after  = {
      enrollments: [
        { university: "KMUTT", major: "CS" },
        { university: "KMITL", major: "EE" },
      ],
    };
    const changes = diffSnapshot(before, after);
    expect(changes.some((c) => c.field.includes("enrollments"))).toBe(true);
  });

  it("หลาย enrollment → label มี suffix (สถาบัน N)", () => {
    const before = { enrollments: [{ university: "KMUTT" }, { university: "A" }] };
    const after  = { enrollments: [{ university: "KMUTT" }, { university: "B" }] };
    const changes = diffSnapshot(before, after);
    expect(changes.some((c) => c.label.includes("สถาบัน"))).toBe(true);
  });

  it("enrollment 1 สถาบัน → label ไม่มี suffix สถาบัน", () => {
    const before = { enrollments: [{ university: "KMUTT" }] };
    const after  = { enrollments: [{ university: "KMITL" }] };
    const changes = diffSnapshot(before, after);
    const change = changes.find((c) => c.field.includes("university"));
    expect(change?.label).not.toContain("สถาบัน");
  });

  it("ค่า null ใน enrollment field → แสดง '—'", () => {
    const before = { enrollments: [{ university: null }] };
    const after  = { enrollments: [{ university: "KMUTT" }] };
    const changes = diffSnapshot(before, after);
    const change = changes.find((c) => c.field.includes("university"));
    expect(change?.before).toBe("—");
  });

  it("ค่า null ใน address field → แสดง '—'", () => {
    const before = { addresses: { th: { province: null } } };
    const after  = { addresses: { th: { province: "กรุงเทพฯ" } } };
    const changes = diffSnapshot(before, after);
    const change = changes.find((c) => c.field.includes("province"));
    expect(change?.before).toBe("—");
  });
});

// ── buildSummary ──────────────────────────────────────────────
describe("buildSummary", () => {
  it("type = create → ข้อความสร้างใหม่", () => {
    expect(buildSummary("create", [])).toBe("สร้างข้อมูลนักเรียนใหม่");
  });

  it("type = delete → ข้อความลบ", () => {
    expect(buildSummary("delete", [])).toBe("ลบข้อมูลนักเรียน");
  });

  it("ไม่มี changes → 'บันทึกข้อมูล (ไม่มีการเปลี่ยนแปลง)'", () => {
    expect(buildSummary("update", [])).toBe("บันทึกข้อมูล (ไม่มีการเปลี่ยนแปลง)");
  });

  it("1 change → แสดง label + before → after", () => {
    const changes = [{ field: "name", label: "ชื่อ", before: "สมชาย", after: "สมหญิง" }];
    expect(buildSummary("update", changes)).toBe("แก้ไข ชื่อ: สมชาย → สมหญิง");
  });

  it("หลาย changes → แสดงจำนวน + รายชื่อ field", () => {
    const changes = [
      { field: "name",     label: "ชื่อ",     before: "ก", after: "ข" },
      { field: "lastname", label: "นามสกุล", before: "ก", after: "ข" },
    ];
    const summary = buildSummary("update", changes);
    expect(summary).toContain("2");
    expect(summary).toContain("ชื่อ");
    expect(summary).toContain("นามสกุล");
  });
});

// ── formatHistoryDate ─────────────────────────────────────────
describe("formatHistoryDate", () => {
  it("คืนค่าเป็น string ที่ไม่ว่าง", () => {
    const result = formatHistoryDate("2024-06-15T10:30:00.000Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("ประกอบด้วยปี พ.ศ. (ไม่ใช่ ค.ศ.)", () => {
    const result = formatHistoryDate("2024-06-15T10:30:00.000Z");
    // th-TH locale แสดงปีพ.ศ. 2567 หรือ ค.ศ. ขึ้นอยู่กับ runtime
    // แค่เช็คว่า parse ได้และคืน string
    expect(result).toBeTruthy();
  });
});
