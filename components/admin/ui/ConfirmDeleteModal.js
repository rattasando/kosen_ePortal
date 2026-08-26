"use client";

import { useEffect } from "react";

const TRASH_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-8 text-red-500"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * ConfirmDeleteModal — modal ยืนยันการลบมาตรฐาน ใช้ร่วมกันทุกโมดูล
 *
 * @param {string}        [heading="ยืนยันการลบ"] — หัวข้อ h2
 * @param {React.ReactNode} children              — เนื้อหาตรงกลาง (ชื่อ item, รายละเอียด ฯลฯ)
 * @param {string}        [confirmLabel="ลบข้อมูล"] — ข้อความปุ่มยืนยัน
 * @param {() => void}    onConfirm              — callback เมื่อกดยืนยัน
 * @param {() => void}    onCancel               — callback เมื่อกดยกเลิก / Esc / คลิกนอก
 *
 * @example
 * <ConfirmDeleteModal
 *   heading="ยืนยันการลบข่าว"
 *   confirmLabel="ลบข่าว"
 *   onConfirm={() => { deleteNews(id); setDelTarget(null); }}
 *   onCancel={() => setDelTarget(null)}
 * >
 *   <p className="mt-2 text-sm text-muted">ต้องการลบข่าว</p>
 *   <p className="mt-1 font-semibold text-foreground">"{title}"</p>
 * </ConfirmDeleteModal>
 */
export default function ConfirmDeleteModal({
  heading = "ยืนยันการลบ",
  children,
  confirmLabel = "ลบข้อมูล",
  onConfirm,
  onCancel,
}) {
  // ESC key — ปิด modal
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* dialog */}
      <div
        className="relative w-full max-w-sm rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* icon + heading + content */}
        <div className="flex flex-col items-center px-6 pt-8 pb-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
            {TRASH_ICON}
          </div>

          <h2 className="text-lg font-bold text-foreground">{heading}</h2>

          {children}

          {/* warning strip */}
          <div className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
            ⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </div>
        </div>

        {/* action buttons */}
        <div className="flex gap-3 border-t border-border px-6 py-4">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-muted transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
