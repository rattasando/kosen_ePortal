/**
 * pagination.js — pure pagination helpers
 *
 * แยกออกจาก ListClient components ทุกตัว (logic เหมือนกันทุกที่)
 */

/**
 * คำนวณ pagination จาก array ทั้งหมด
 *
 * @param {any[]}  items    — filtered array ที่ต้องการแบ่งหน้า
 * @param {number} page     — หน้าปัจจุบัน (1-based, อาจ > totalPages ได้)
 * @param {number} pageSize — จำนวนรายการต่อหน้า
 * @returns {{
 *   paginated:  any[],
 *   totalPages: number,
 *   safePage:   number,
 *   rangeStart: number,
 *   rangeEnd:   number,
 * }}
 */
export function paginateItems(items, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage   = Math.min(Math.max(1, page), totalPages);
  const paginated  = items.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = items.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd   = Math.min(safePage * pageSize, items.length);
  return { paginated, totalPages, safePage, rangeStart, rangeEnd };
}
