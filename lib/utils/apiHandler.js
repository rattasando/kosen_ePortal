/**
 * apiHandler.js — Next.js App Router error wrapper + response helpers
 *
 * ใช้คู่กับ apiError.js เพื่อให้ทุก route มี error handling ที่สม่ำเสมอ
 */
import { NextResponse } from "next/server";
import { formatApiError } from "@/lib/utils/apiError";

// ── Response helpers ─────────────────────────────────────────

/** 200 OK พร้อม JSON body */
export const ok = (data) => NextResponse.json(data);

/** 201 Created พร้อม JSON body */
export const created = (data) => NextResponse.json(data, { status: 201 });

/** 404 Not Found */
export const notFound = (message = "Not found") =>
  NextResponse.json({ error: message }, { status: 404 });

/** 400 Bad Request */
export const badRequest = (message) =>
  NextResponse.json({ error: message }, { status: 400 });

/** 409 Conflict */
export const conflict = (message) =>
  NextResponse.json({ error: message }, { status: 409 });

// ── withErrorHandler ─────────────────────────────────────────

/**
 * ห่อ route handler ด้วย try/catch อัตโนมัติ
 * — Prisma P2025 → 404, P2002 → 409, P2000 → 400, อื่น ๆ → 500
 * — log ทุก error พร้อม label ที่อ่านออก
 *
 * @param {Function} handler — async (request, context) => NextResponse
 * @param {string}   [label] — ชื่อ route สำหรับ log เช่น "GET /api/news"
 * @returns {Function}
 *
 * @example
 * export const GET = withErrorHandler(async (_, { params }) => {
 *   const { id } = await params;
 *   const item = await prisma.news.findUnique({ where: { id } });
 *   if (!item) return notFound();
 *   return ok(item);
 * }, "GET /api/news/[id]");
 */
export function withErrorHandler(handler, label = "") {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (err) {
      const prefix = label ? `[${label}]` : "[API]";
      console.error(`${prefix}`, err);
      const { body, status } = formatApiError(err);
      return NextResponse.json(body, { status });
    }
  };
}
