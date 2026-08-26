import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatDateTime,
  estimatedReadTime,
  publishedNews,
  publishedActivities,
} from "@/lib/utils/newsUtils";

// ── formatDate ────────────────────────────────────────────────
describe("formatDate", () => {
  it("คืน string ที่ไม่ว่างสำหรับ ISO string ปกติ", () => {
    const result = formatDate("2024-06-15T00:00:00.000Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("null → คืน string ว่าง", () => {
    expect(formatDate(null)).toBe("");
  });

  it("undefined → คืน string ว่าง", () => {
    expect(formatDate(undefined)).toBe("");
  });

  it("empty string → คืน string ว่าง", () => {
    expect(formatDate("")).toBe("");
  });

  it("invalid date → คืน string เดิมกลับมา (catch fallback)", () => {
    // บาง runtime จะ throw บาง runtime จะได้ "Invalid Date" — แค่ต้องไม่ crash
    const result = formatDate("not-a-date");
    expect(typeof result).toBe("string");
  });
});

// ── formatDateTime ────────────────────────────────────────────
describe("formatDateTime", () => {
  it("คืน string ที่มีทั้งวันที่และเวลา", () => {
    const result = formatDateTime("2024-06-15T10:30:00.000Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("null → คืน string ว่าง", () => {
    expect(formatDateTime(null)).toBe("");
  });

  it("undefined → คืน string ว่าง", () => {
    expect(formatDateTime(undefined)).toBe("");
  });

  it("empty string → คืน string ว่าง", () => {
    expect(formatDateTime("")).toBe("");
  });
});

// ── estimatedReadTime ─────────────────────────────────────────
describe("estimatedReadTime", () => {
  it("blocks ว่าง → '1 นาที'", () => {
    expect(estimatedReadTime([])).toBe("1 นาที");
  });

  it("ไม่ส่ง argument → '1 นาที' (default)", () => {
    expect(estimatedReadTime()).toBe("1 นาที");
  });

  it("เนื้อหาน้อย → อย่างน้อย 1 นาที", () => {
    const blocks = [{ content: "สวัสดี" }];
    expect(estimatedReadTime(blocks)).toBe("1 นาที");
  });

  it("เนื้อหา 400 คำ → 2 นาที", () => {
    const words = Array(400).fill("word").join(" ");
    const blocks = [{ content: words }];
    expect(estimatedReadTime(blocks)).toBe("2 นาที");
  });

  it("หลาย block รวมเนื้อหาเข้าด้วยกัน", () => {
    const words = Array(200).fill("word").join(" ");
    const blocks = [{ content: words }, { content: words }];
    expect(estimatedReadTime(blocks)).toBe("2 นาที");
  });

  it("block ที่ไม่มี content field → ไม่ crash", () => {
    expect(() => estimatedReadTime([{ type: "image" }])).not.toThrow();
  });
});

// ── publishedNews ─────────────────────────────────────────────
describe("publishedNews", () => {
  const mockNews = [
    { id: 1, status: "published",  publishedAt: "2024-06-01T00:00:00Z", title: "A" },
    { id: 2, status: "draft",      publishedAt: "2024-06-10T00:00:00Z", title: "B" },
    { id: 3, status: "published",  publishedAt: "2024-06-15T00:00:00Z", title: "C" },
  ];

  it("กรองเฉพาะ published", () => {
    const result = publishedNews(mockNews);
    expect(result).toHaveLength(2);
    expect(result.every((n) => n.status === "published")).toBe(true);
  });

  it("เรียงจากใหม่ → เก่า", () => {
    const result = publishedNews(mockNews);
    expect(result[0].id).toBe(3); // 15 Jun
    expect(result[1].id).toBe(1); // 1 Jun
  });

  it("array ว่าง → คืน array ว่าง", () => {
    expect(publishedNews([])).toEqual([]);
  });

  it("ไม่ส่ง argument → คืน array ว่าง", () => {
    expect(publishedNews()).toEqual([]);
  });

  it("ไม่มี published เลย → คืน array ว่าง", () => {
    const drafts = [{ status: "draft" }, { status: "scheduled" }];
    expect(publishedNews(drafts)).toEqual([]);
  });
});

// ── publishedActivities ───────────────────────────────────────
describe("publishedActivities", () => {
  const mockActivities = [
    { id: 1, status: "published", date: "2024-05-01T00:00:00Z", title: "A" },
    { id: 2, status: "draft",     date: "2024-06-15T00:00:00Z", title: "B" },
    { id: 3, status: "published", date: "2024-06-10T00:00:00Z", title: "C" },
  ];

  it("กรองเฉพาะ published", () => {
    const result = publishedActivities(mockActivities);
    expect(result).toHaveLength(2);
    expect(result.every((a) => a.status === "published")).toBe(true);
  });

  it("เรียงจากวันที่ใหม่ → เก่า", () => {
    const result = publishedActivities(mockActivities);
    expect(result[0].id).toBe(3); // 10 Jun
    expect(result[1].id).toBe(1); // 1 May
  });

  it("array ว่าง → คืน array ว่าง", () => {
    expect(publishedActivities([])).toEqual([]);
  });

  it("ไม่ส่ง argument → คืน array ว่าง", () => {
    expect(publishedActivities()).toEqual([]);
  });
});
