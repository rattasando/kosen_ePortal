"use client";

import { useState, useEffect, useRef } from "react";

/**
 * StudentEmailModal — modal เขียนและส่งอีเมลหานักเรียน
 *
 * @param {{ prefix, name, lastname, email }} student — ข้อมูลผู้รับ
 * @param {() => void} onClose
 */
export default function StudentEmailModal({ student, onClose }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const subjectRef = useRef(null);

  useEffect(() => {
    subjectRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) return;
    console.log("Send email to", student.email, { subject, message });
    setSent(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(student.email);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">ส่งอีเมล</p>
              <p className="text-xs text-muted">{student.prefix}{student.name} {student.lastname}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-foreground">ส่งอีเมลเรียบร้อยแล้ว</p>
            <p className="text-xs text-muted">ถึง {student.email}</p>
            <button onClick={onClose} className="mt-2 btn-primary">ปิด</button>
          </div>
        ) : (
          <div className="space-y-4 p-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">ถึง</label>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2">
                <span className="flex-1 text-sm text-foreground">{student.email}</span>
                <button onClick={handleCopy} title="คัดลอกอีเมล" className="text-muted hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">หัวข้อ</label>
              <input
                ref={subjectRef}
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="ระบุหัวข้ออีเมล..."
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">ข้อความ</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="พิมพ์ข้อความที่ต้องการส่ง..."
                className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
                ยกเลิก
              </button>
              <button
                onClick={handleSend}
                disabled={!subject.trim() || !message.trim()}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
                ส่งอีเมล
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
