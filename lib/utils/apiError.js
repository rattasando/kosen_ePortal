/**
 * apiError.js — pure helpers สำหรับ API error handling
 *
 * ไม่มี Next.js dependency — unit testable ได้เต็มที่
 */

// ── Prisma error codes ────────────────────────────────────────
// https://www.prisma.io/docs/reference/api-reference/error-reference

/** Map Prisma error code → HTTP status */
export const PRISMA_STATUS = {
  P2000: 400, // value too long for column
  P2001: 404, // record not found in where clause
  P2002: 409, // unique constraint failed
  P2003: 400, // foreign key constraint failed
  P2025: 404, // record not found (delete/update)
};

/**
 * คำนวณ HTTP status ที่เหมาะสมจาก error object
 *
 * @param {Error & { code?: string }} err
 * @returns {number} HTTP status code
 */
export function getErrorStatus(err) {
  if (!err) return 500;
  if (err.code && PRISMA_STATUS[err.code] !== undefined)
    return PRISMA_STATUS[err.code];
  // HTTP errors ที่ client ส่งมาเองผ่าน { status }
  if (typeof err.status === "number") return err.status;
  return 500;
}

/**
 * สร้าง error payload สำหรับ NextResponse.json()
 *
 * @param {Error & { code?: string; status?: number }} err
 * @returns {{ body: { error: string }, status: number }}
 */
export function formatApiError(err) {
  return {
    body: { error: err?.message ?? "Internal server error" },
    status: getErrorStatus(err),
  };
}

/**
 * สร้าง error object ง่าย ๆ ที่มี status แนบมาด้วย
 * ใช้สำหรับ throw ข้อผิดพลาด business logic ที่ไม่ใช่ Prisma error
 *
 * @param {string} message
 * @param {number} status
 * @returns {Error & { status: number }}
 */
export function createError(message, status = 500) {
  const err = new Error(message);
  err.status = status;
  return err;
}
