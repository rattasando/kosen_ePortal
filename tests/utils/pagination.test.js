import { describe, it, expect } from "vitest";
import { paginateItems } from "../../lib/utils/pagination";

const items = Array.from({ length: 55 }, (_, i) => ({ id: i + 1 }));

describe("paginateItems", () => {
  it("หน้าแรก — คืน pageSize รายการแรก", () => {
    const { paginated, totalPages, safePage, rangeStart, rangeEnd } =
      paginateItems(items, 1, 10);
    expect(paginated).toHaveLength(10);
    expect(paginated[0].id).toBe(1);
    expect(paginated[9].id).toBe(10);
    expect(totalPages).toBe(6);
    expect(safePage).toBe(1);
    expect(rangeStart).toBe(1);
    expect(rangeEnd).toBe(10);
  });

  it("หน้ากลาง — คืน slice ที่ถูกต้อง", () => {
    const { paginated, rangeStart, rangeEnd } = paginateItems(items, 3, 10);
    expect(paginated[0].id).toBe(21);
    expect(rangeStart).toBe(21);
    expect(rangeEnd).toBe(30);
  });

  it("หน้าสุดท้าย — คืนรายการที่เหลือ (ไม่ครบ pageSize)", () => {
    const { paginated, rangeEnd, totalPages, safePage } = paginateItems(items, 6, 10);
    expect(paginated).toHaveLength(5);  // 55 - 50 = 5 เหลือ
    expect(rangeEnd).toBe(55);
    expect(totalPages).toBe(6);
    expect(safePage).toBe(6);
  });

  it("page > totalPages — clamp ไปยังหน้าสุดท้าย", () => {
    const { safePage, paginated } = paginateItems(items, 999, 10);
    expect(safePage).toBe(6);
    expect(paginated).toHaveLength(5);
  });

  it("page < 1 — clamp ไปยังหน้าแรก", () => {
    const { safePage } = paginateItems(items, -5, 10);
    expect(safePage).toBe(1);
  });

  it("array ว่าง — totalPages = 1, rangeStart = 0", () => {
    const { paginated, totalPages, rangeStart, rangeEnd } = paginateItems([], 1, 10);
    expect(paginated).toHaveLength(0);
    expect(totalPages).toBe(1);
    expect(rangeStart).toBe(0);
    expect(rangeEnd).toBe(0);
  });

  it("pageSize ใหญ่กว่าจำนวน items — คืนทั้งหมดในหน้าเดียว", () => {
    const few = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const { paginated, totalPages } = paginateItems(few, 1, 20);
    expect(paginated).toHaveLength(3);
    expect(totalPages).toBe(1);
  });
});
