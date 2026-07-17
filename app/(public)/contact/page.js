"use client";

import { useContact } from "@/components/admin/ContactContext";

const FALLBACK_COLORS = [
  "bg-blue-50 border-blue-200 text-blue-700",
  "bg-green-50 border-green-200 text-green-700",
  "bg-violet-50 border-violet-200 text-violet-700",
  "bg-amber-50 border-amber-200 text-amber-700",
];
const FALLBACK_DOTS = ["bg-blue-500", "bg-green-500", "bg-violet-500", "bg-amber-500"];
const SPAN_CLASS = {
  0.5: "col-span-1", 1: "col-span-2", 1.5: "col-span-3", 2: "col-span-4",
  2.5: "col-span-5", 3: "col-span-6", 3.5: "col-span-7", 4: "col-span-8",
};

export default function ContactPage() {
  const { main, universities, social, ready } = useContact();

  if (!ready) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-muted text-sm">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">

      {/* ── Page header ── */}
      <div className="border-b border-border bg-white pt-8 pb-6">
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">ติดต่อเรา</h1>
        </div>
      </div>

      {/* Main contact info */}
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-12">
        <h2 className="mb-8 text-3xl font-extrabold tracking-tight text-foreground">
          สำนักงานกลาง
        </h2>

        <div className="grid gap-5 grid-cols-4 lg:grid-cols-8">
          {main.map((c) => (
            <div key={c.id} className={`card p-6 ${SPAN_CLASS[c.span ?? 1] ?? "col-span-2"}`}>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-2xl">
                {c.icon}
              </div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted mb-1">
                {c.label}
              </p>
              {c.href ? (
                <a
                  href={c.href}
                  className="font-medium text-primary hover:underline text-base leading-relaxed"
                  {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {c.lines[0]}
                </a>
              ) : (
                <div className="space-y-0.5">
                  {c.lines.map((line, i) => (
                    <p key={i} className="text-base font-medium text-foreground leading-relaxed">{line}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* University contacts */}
      {universities.length > 0 && (
        <div className="border-y border-border bg-slate-50 py-12">
          <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12">
            <h2 className="mb-8 text-3xl font-extrabold tracking-tight text-foreground">
              ติดต่อแต่ละมหาวิทยาลัย
            </h2>

            <div className="grid gap-5 grid-cols-4 lg:grid-cols-8">
              {universities.map((u, idx) => (
                <div key={u.id} className={`card p-6 ${SPAN_CLASS[u.span ?? 1] ?? "col-span-2"}`}>
                  <div className="mb-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-sm font-bold ${u.color ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.dot ?? FALLBACK_DOTS[idx % FALLBACK_DOTS.length]}`} />
                      {u.name}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground leading-snug mb-3">{u.fullName}</h3>
                  <div className="space-y-2">
                    {u.location && (
                      <div className="flex items-center gap-2 text-base text-muted">
                        <span>📍</span><span>{u.location}</span>
                      </div>
                    )}
                    {u.phone && (
                      <div className="flex items-center gap-2 text-base">
                        <span>📞</span>
                        <a href={`tel:${u.phone.replace(/\s/g, "")}`} className="text-primary hover:underline font-medium">{u.phone}</a>
                      </div>
                    )}
                    {u.email && (
                      <div className="flex items-center gap-2 text-base">
                        <span>✉️</span>
                        <a href={`mailto:${u.email}`} className="text-primary hover:underline font-medium">{u.email}</a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Social media */}
      {social.length > 0 && (
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-12">
          <h2 className="mb-8 text-3xl font-extrabold tracking-tight text-foreground">
            ติดตามเราได้ที่
          </h2>

          <div className="grid gap-4 grid-cols-4 lg:grid-cols-8">
            {social.map((s) => (
              <a
                key={s.id}
                href={s.href || "#"}
                className={`card card-hover p-5 flex flex-row items-center gap-4 ${SPAN_CLASS[s.span ?? 1] ?? "col-span-2"}`}
                {...(s.href?.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-2xl">
                  {s.icon}
                </div>
                <div>
                  <p className="text-base font-bold text-foreground">{s.label}</p>
                  <p className="text-sm text-muted">{s.handle}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
