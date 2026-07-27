"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { DEFAULT_FAQS, FAQ_STORAGE_KEY, FAQ_SEED_KEY, FAQ_SEED_VER } from "@/lib/data/faqData";

const BOT_INTRO = "สวัสดีครับ! ฉันคือผู้ช่วย KOSEN 👋\nพิมพ์คำถาม หรือเลือกหัวข้อด้านล่างได้เลยครับ";
const NO_RESULT_MSG = (q) =>
  `ขออภัย ไม่พบคำถามที่เกี่ยวข้องกับ "${q}" ครับ\nลองพิมพ์คำอื่น หรือติดต่อเราได้ที่ info@kosen.ac.th`;

function loadPublishedFaqs() {
  try {
    const ver    = localStorage.getItem(FAQ_SEED_KEY);
    const stored = localStorage.getItem(FAQ_STORAGE_KEY);
    const data   = stored && ver === FAQ_SEED_VER ? JSON.parse(stored) : DEFAULT_FAQS;
    return data
      .filter((f) => f.status === "published")
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch {
    return DEFAULT_FAQS.filter((f) => f.status === "published");
  }
}

function matchFaqs(items, query) {
  if (!query.trim()) return items;
  const q = query.trim().toLowerCase();
  return items.filter(
    (f) =>
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q) ||
      (f.category ?? "").toLowerCase().includes(q)
  );
}

function BotAvatar() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold shadow-sm">
      K
    </div>
  );
}

function HighlightText({ text, query }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-amber-200 text-amber-900 not-italic px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function FAQChatbot() {
  const [open, setOpen]         = useState(false);
  const [faqs, setFaqs]         = useState([]);
  const [messages, setMessages] = useState([{ role: "bot", text: BOT_INTRO }]);
  const [showFAQ, setShowFAQ]   = useState(true);
  const [query, setQuery]       = useState("");
  const [unread, setUnread]     = useState(false);

  const bottomRef = useRef(null);
  const windowRef = useRef(null);
  const inputRef  = useRef(null);

  // Load FAQ data from localStorage (same store as admin)
  useEffect(() => {
    setFaqs(loadPublishedFaqs());
  }, []);

  // Reload when window gains focus (admin may have updated data)
  useEffect(() => {
    const onFocus = () => setFaqs(loadPublishedFaqs());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const filteredFaqs = useMemo(() => matchFaqs(faqs, query), [faqs, query]);

  // Unread indicator
  useEffect(() => {
    if (!open && messages.length > 1) setUnread(true);
    if (open) setUnread(false);
  }, [open, messages.length]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Focus input when opening
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (windowRef.current && !windowRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleQuestion = (faq) => {
    setShowFAQ(false);
    setQuery("");
    setMessages((prev) => [
      ...prev,
      { role: "user", text: faq.question },
      { role: "bot", text: faq.answer },
    ]);
  };

  const handleReset = () => {
    setMessages([{ role: "bot", text: BOT_INTRO }]);
    setShowFAQ(true);
    setQuery("");
    inputRef.current?.focus();
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!showFAQ && val.trim()) setShowFAQ(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (filteredFaqs.length > 0) {
      handleQuestion(filteredFaqs[0]);
    } else {
      setShowFAQ(false);
      setQuery("");
      setMessages((prev) => [
        ...prev,
        { role: "user", text: q },
        { role: "bot", text: NO_RESULT_MSG(q) },
      ]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3" ref={windowRef}>
      {/* ── Chat window ── */}
      <div
        className={`flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl transition-all duration-300 origin-bottom-right ${
          open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
        }`}
        style={{ width: "320px", maxHeight: open ? "500px" : "0px", minHeight: open ? "340px" : "0px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-primary px-4 py-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white text-sm font-extrabold">K</div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">KOSEN Assistant</p>
              <p className="text-[10px] text-white/70 mt-0.5">FAQ &amp; ข้อมูลโครงการ</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 hover:bg-white/20 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Messages + FAQ */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-surface-muted/30">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {msg.role === "bot" && <BotAvatar />}
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-tr-sm"
                    : "bg-surface border border-border text-foreground rounded-tl-sm shadow-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* FAQ quick-reply buttons */}
          {showFAQ && (
            <div className="flex flex-col gap-1.5 pl-9">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq) => (
                  <button
                    key={faq.id}
                    onClick={() => handleQuestion(faq)}
                    className="text-left rounded-xl border border-primary/30 bg-white px-3 py-2 text-xs font-medium text-primary hover:bg-primary hover:text-white hover:border-primary transition-colors shadow-sm"
                  >
                    <HighlightText text={faq.question} query={query} />
                  </button>
                ))
              ) : (
                <p className="text-xs text-muted italic px-1">ไม่พบคำถามที่ตรงกัน — กด Enter เพื่อส่ง</p>
              )}
            </div>
          )}

          {/* Back to FAQ */}
          {!showFAQ && (
            <div className="pl-9">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted hover:text-primary hover:border-primary transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                กลับไปที่คำถาม
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Search input */}
        <form onSubmit={handleSubmit} className="shrink-0 border-t border-border bg-surface px-3 py-2.5 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="พิมพ์ keyword แล้วกด Enter…"
            className="flex-1 rounded-lg border border-border bg-surface-muted/50 px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 placeholder:text-muted transition"
          />
          <button
            type="submit"
            disabled={!query.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-30 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </form>
      </div>

      {/* ── Toggle button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "ปิด FAQ" : "เปิด FAQ"}
        className={`relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 active:scale-95 ${
          open
            ? "bg-surface border border-border text-muted hover:text-foreground"
            : "bg-primary text-white hover:opacity-90"
        }`}
      >
        {unread && !open && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">!</span>
        )}
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>
    </div>
  );
}
