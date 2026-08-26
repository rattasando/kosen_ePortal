"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStudents } from "@/components/admin/contexts/StudentContext";
import ConfirmDeleteModal from "@/components/admin/ui/ConfirmDeleteModal";

export default function StudentActionButtons({ id, name }) {
  const { deleteStudent } = useStudents();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const handleConfirm = () => {
    deleteStudent(id);
    setShowModal(false);
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center justify-center gap-1">
        <Link
          href={`/admin/students/${id}`}
          title="ดูข้อมูล"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-primary hover:text-primary transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        </Link>
        <Link
          href={`/admin/students/${id}?edit=1`}
          title="แก้ไข"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-amber-500 hover:text-amber-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </Link>
        <button
          onClick={() => setShowModal(true)}
          title="ลบ"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-red-500 hover:text-red-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {showModal && (
        <ConfirmDeleteModal
          heading="ยืนยันการลบข้อมูล"
          confirmLabel="ลบข้อมูล"
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(false)}
        >
          <p className="mt-2 text-sm text-muted">คุณต้องการลบข้อมูลของ</p>
          <p className="mt-1 font-semibold text-foreground">{name}</p>
          <p className="text-xs text-muted">รหัส {id}</p>
        </ConfirmDeleteModal>
      )}
    </>
  );
}
