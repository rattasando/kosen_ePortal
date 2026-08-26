import { describe, it, expect } from "vitest";
import {
  getErrorStatus,
  formatApiError,
  createError,
  PRISMA_STATUS,
} from "../../lib/utils/apiError";

// ── PRISMA_STATUS map ─────────────────────────────────────────

describe("PRISMA_STATUS", () => {
  it("มี code ครบตามที่กำหนด", () => {
    expect(PRISMA_STATUS.P2025).toBe(404);
    expect(PRISMA_STATUS.P2002).toBe(409);
    expect(PRISMA_STATUS.P2000).toBe(400);
    expect(PRISMA_STATUS.P2003).toBe(400);
    expect(PRISMA_STATUS.P2001).toBe(404);
  });
});

// ── getErrorStatus ────────────────────────────────────────────

describe("getErrorStatus", () => {
  it("null/undefined → 500", () => {
    expect(getErrorStatus(null)).toBe(500);
    expect(getErrorStatus(undefined)).toBe(500);
  });

  it("error ทั่วไปไม่มี code → 500", () => {
    expect(getErrorStatus(new Error("boom"))).toBe(500);
  });

  it("Prisma P2025 (record not found) → 404", () => {
    const err = new Error("record not found");
    err.code = "P2025";
    expect(getErrorStatus(err)).toBe(404);
  });

  it("Prisma P2001 (not found in where) → 404", () => {
    const err = new Error("no record");
    err.code = "P2001";
    expect(getErrorStatus(err)).toBe(404);
  });

  it("Prisma P2002 (unique constraint) → 409", () => {
    const err = new Error("unique constraint");
    err.code = "P2002";
    expect(getErrorStatus(err)).toBe(409);
  });

  it("Prisma P2000 (value too long) → 400", () => {
    const err = new Error("value too long");
    err.code = "P2000";
    expect(getErrorStatus(err)).toBe(400);
  });

  it("Prisma P2003 (foreign key) → 400", () => {
    const err = new Error("foreign key");
    err.code = "P2003";
    expect(getErrorStatus(err)).toBe(400);
  });

  it("error ที่มี .status แนบมา → ใช้ค่านั้น", () => {
    const err = new Error("forbidden");
    err.status = 403;
    expect(getErrorStatus(err)).toBe(403);
  });

  it("Prisma code มีก่อน — ถ้ามีทั้ง code และ status ให้ Prisma code ชนะ", () => {
    const err = new Error("test");
    err.code = "P2025";
    err.status = 400; // override เพิ่มมาเอง
    // Prisma code check ก่อน → 404
    expect(getErrorStatus(err)).toBe(404);
  });
});

// ── formatApiError ────────────────────────────────────────────

describe("formatApiError", () => {
  it("error ทั่วไป → { body: { error }, status: 500 }", () => {
    const { body, status } = formatApiError(new Error("something broke"));
    expect(status).toBe(500);
    expect(body.error).toBe("something broke");
  });

  it("Prisma P2025 → status 404", () => {
    const err = new Error("not found");
    err.code = "P2025";
    const { status } = formatApiError(err);
    expect(status).toBe(404);
  });

  it("null → fallback message + 500", () => {
    const { body, status } = formatApiError(null);
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });

  it("error ที่ไม่มี message → fallback", () => {
    const { body } = formatApiError({});
    expect(body.error).toBe("Internal server error");
  });
});

// ── createError ───────────────────────────────────────────────

describe("createError", () => {
  it("สร้าง Error พร้อม .status", () => {
    const err = createError("ไม่พบข้อมูล", 404);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("ไม่พบข้อมูล");
    expect(err.status).toBe(404);
  });

  it("default status = 500", () => {
    const err = createError("oops");
    expect(err.status).toBe(500);
  });

  it("getErrorStatus รู้จัก .status ที่สร้างด้วย createError", () => {
    const err = createError("unauthorized", 401);
    expect(getErrorStatus(err)).toBe(401);
  });
});
