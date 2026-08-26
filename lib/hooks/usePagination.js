"use client";

import { useState } from "react";
import { paginateItems } from "@/lib/utils/pagination";

/**
 * usePagination — shared pagination hook สำหรับ ListClient ทุก module
 *
 * @param {any[]}  items           — filtered items ที่ต้องการแบ่งหน้า
 * @param {number} defaultPageSize — จำนวนรายการต่อหน้าเริ่มต้น (default 20)
 * @returns {{
 *   page:        number,   setPage:     (n: number) => void,
 *   pageSize:    number,   setPageSize: (n: number) => void,
 *   paginated:   any[],
 *   totalPages:  number,
 *   rangeStart:  number,
 *   rangeEnd:    number,
 * }}
 */
export function usePagination(items, defaultPageSize = 20) {
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const { paginated, totalPages, safePage, rangeStart, rangeEnd } =
    paginateItems(items, page, pageSize);

  // expose safePage as page — consumer ไม่ต้องรู้เรื่อง safePage แยก
  return {
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    paginated,
    totalPages,
    rangeStart,
    rangeEnd,
  };
}
