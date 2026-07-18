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
  0.5:  "col-span-2",  0.75: "col-span-3",  1:   "col-span-4",
  1.5:  "col-span-6",  2:    "col-span-8",   2.5: "col-span-10",
  3:    "col-span-12", 3.5:  "col-span-14",  4:   "col-span-16",
};
const ICON_CLASS = {
  0.5:  "h-7 w-7 text-base",  0.75: "h-8 w-8 text-lg",   1:   "h-9 w-9 text-xl",
  1.5:  "h-10 w-10 text-xl",  2:    "h-11 w-11 text-2xl", 2.5: "h-11 w-11 text-2xl",
  3:    "h-12 w-12 text-2xl", 3.5:  "h-12 w-12 text-2xl", 4:   "h-12 w-12 text-2xl",
};
const PAD_CLASS = {
  0.5:  "p-3", 0.75: "p-3", 1:   "p-4",
  1.5:  "p-5", 2:    "p-6", 2.5: "p-6",
  3:    "p-6", 3.5:  "p-6", 4:   "p-6",
};
const FONT_CLASSES = {
  xs:   { label: "text-xs",   body: "text-xs"   },
  sm:   { label: "text-xs",   body: "text-sm"   },
  base: { label: "text-sm",   body: "text-base" },
  lg:   { label: "text-sm",   body: "text-lg"   },
  xl:   { label: "text-base", body: "text-xl"   },
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

        <div className="grid gap-5 grid-cols-8 lg:grid-cols-16">
          {main.map((c) => {
            const span = c.span ?? 1;
            const iconCls = ICON_CLASS[span] ?? "h-10 w-10 text-xl";
            const padCls = PAD_CLASS[span] ?? "p-5";
            const fc = FONT_CLASSES[c.fontSize ?? "base"] ?? FONT_CLASSES.base;
            return (
              <div key={c.id} className={`card ${padCls} ${SPAN_CLASS[span] ?? "col-span-2"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`flex shrink-0 items-center justify-center rounded-xl bg-accent-soft ${iconCls}`}>
                    {c.icon}
                  </div>
                  <p className={`${fc.label} font-semibold uppercase tracking-wide text-muted`}>
                    {c.label}
                  </p>
                </div>
                {c.href ? (
                  <a
                    href={c.href}
                    className={`font-medium text-primary hover:underline ${fc.body} leading-relaxed`}
                    {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {c.lines[0]}
                  </a>
                ) : (
                  <div className="space-y-0.5">
                    {c.lines.map((line, i) => (
                      <p key={i} className={`${fc.body} font-medium text-foreground leading-relaxed`}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* University contacts */}
      {universities.length > 0 && (
        <div className="border-y border-border bg-slate-50 py-12">
          <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12">
            <h2 className="mb-8 text-3xl font-extrabold tracking-tight text-foreground">
              ติดต่อแต่ละมหาวิทยาลัย
            </h2>

            <div className="grid gap-5 grid-cols-8 lg:grid-cols-16">
              {universities.map((u, idx) => {
                const span = u.span ?? 1;
                const padCls = PAD_CLASS[span] ?? "p-5";
                const fc = FONT_CLASSES[u.fontSize ?? "base"] ?? FONT_CLASSES.base;
                return (
                <div key={u.id} className={`card ${padCls} ${SPAN_CLASS[span] ?? "col-span-2"}`}>
                  <div className="mb-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-sm font-bold ${u.color ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.dot ?? FALLBACK_DOTS[idx % FALLBACK_DOTS.length]}`} />
                      {u.name}
                    </span>
                  </div>
                  <h3 className={`${fc.body} font-bold text-foreground leading-snug mb-3`}>{u.fullName}</h3>
                  <div className="space-y-2">
                    {u.location && (
                      <div className={`flex items-center gap-2 ${fc.body} text-muted`}>
                        <span>📍</span><span>{u.location}</span>
                      </div>
                    )}
                    {u.phone && (
                      <div className={`flex items-center gap-2 ${fc.body}`}>
                        <span>📞</span>
                        <a href={`tel:${u.phone.replace(/\s/g, "")}`} className="text-primary hover:underline font-medium">{u.phone}</a>
                      </div>
                    )}
                    {u.email && (
                      <div className={`flex items-center gap-2 ${fc.body}`}>
                        <span>✉️</span>
                        <a href={`mailto:${u.email}`} className="text-primary hover:underline font-medium">{u.email}</a>
                      </div>
                    )}
                    {u.website && (
                      <div className={`flex items-center gap-2 ${fc.body}`}>
                        <span>🌐</span>
                        <a href={u.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">{u.website}</a>
                      </div>
                    )}
                    {u.facebook && (
                      <div className={`flex items-center gap-2 ${fc.body}`}>
                        <span>📘</span>
                        <a href={u.facebook} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">{u.facebook}</a>
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
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

          <div className="grid gap-4 grid-cols-8 lg:grid-cols-16">
            {social.map((s) => {
              const span = s.span ?? 1;
              const iconCls = ICON_CLASS[span] ?? "h-10 w-10 text-xl";
              const padCls = PAD_CLASS[span] ?? "p-5";
              const fc = FONT_CLASSES[s.fontSize ?? "base"] ?? FONT_CLASSES.base;
              return (
              <a
                key={s.id}
                href={s.href || "#"}
                className={`card card-hover ${padCls} flex flex-row items-center gap-3 ${SPAN_CLASS[span] ?? "col-span-2"}`}
                {...(s.href?.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <div className={`flex shrink-0 items-center justify-center rounded-xl bg-accent-soft ${iconCls}`}>
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <p className={`${fc.body} font-bold text-foreground`}>{s.label}</p>
                  <p className={`${fc.label} text-muted truncate`}>{s.handle}</p>
                </div>
              </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
