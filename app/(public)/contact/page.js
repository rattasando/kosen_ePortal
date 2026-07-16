import Link from "next/link";

const CONTACTS = [
  {
    icon: "📍",
    label: "ที่อยู่",
    lines: [
      "สำนักงานโครงการ Thai-KOSEN",
      "123 ถนนวิศวกรรมอุตสาหการ แขวงลาดยาว",
      "เขตจตุจักร กรุงเทพมหานคร 10900",
    ],
    href: null,
  },
  {
    icon: "📞",
    label: "โทรศัพท์",
    lines: ["+66 2 123 4567"],
    href: "tel:+6621234567",
  },
  {
    icon: "✉️",
    label: "อีเมล",
    lines: ["info@kosen.ac.th"],
    href: "mailto:info@kosen.ac.th",
  },
  {
    icon: "🕐",
    label: "เวลาทำการ",
    lines: ["จันทร์ – ศุกร์", "08:00 – 17:00 น."],
    href: null,
  },
];

const UNIVERSITY_CONTACTS = [
  {
    name: "KMITL",
    fullName: "สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง",
    location: "กรุงเทพมหานคร",
    phone: "+66 2 329 8000",
    email: "kosen@kmitl.ac.th",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    dot: "bg-blue-500",
  },
  {
    name: "KMUTT",
    fullName: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี",
    location: "กรุงเทพมหานคร",
    phone: "+66 2 470 8000",
    email: "kosen@kmutt.ac.th",
    color: "bg-green-50 border-green-200 text-green-700",
    dot: "bg-green-500",
  },
];

const SOCIAL = [
  { icon: "📘", label: "Facebook", handle: "ThaiKOSEN", href: "#" },
  { icon: "📸", label: "Instagram", handle: "@thai_kosen", href: "#" },
  { icon: "▶️", label: "YouTube", handle: "Thai KOSEN Channel", href: "#" },
  { icon: "💬", label: "LINE Official", handle: "@thaikosen", href: "#" },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white pb-20">

      {/* ── Page header ── */}
      <div className="border-b border-border bg-white pt-8 pb-6">
        <div className="page-container">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">ติดต่อเรา</h1>
        </div>
      </div>

      {/* Main contact info */}
      <div className="page-container py-12">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
          ข้อมูลติดต่อ
        </p>
        <h2 className="mb-8 text-3xl font-extrabold tracking-tight text-foreground">
          สำนักงานกลาง
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CONTACTS.map((c) => (
            <div key={c.label} className="card p-5">
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
                >
                  {c.lines[0]}
                </a>
              ) : (
                <div className="space-y-0.5">
                  {c.lines.map((line, i) => (
                    <p
                      key={i}
                      className="text-base font-medium text-foreground leading-relaxed"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* University contacts */}
      <div className="border-y border-border bg-slate-50 py-12">
        <div className="page-container">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
            สถาบันพาร์ทเนอร์
          </p>
          <h2 className="mb-8 text-3xl font-extrabold tracking-tight text-foreground">
            ติดต่อแต่ละมหาวิทยาลัย
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            {UNIVERSITY_CONTACTS.map((u) => (
              <div key={u.name} className="card p-6">
                <div className="flex items-start gap-3 mb-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-sm font-bold ${u.color}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${u.dot}`} />
                    {u.name}
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground leading-snug mb-3">
                  {u.fullName}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-base text-muted">
                    <span>📍</span>
                    <span>{u.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-base">
                    <span>📞</span>
                    <a
                      href={`tel:${u.phone.replace(/\s/g, "")}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {u.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-base">
                    <span>✉️</span>
                    <a
                      href={`mailto:${u.email}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {u.email}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social media */}
      <div className="page-container py-12">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
          โซเชียลมีเดีย
        </p>
        <h2 className="mb-8 text-3xl font-extrabold tracking-tight text-foreground">
          ติดตามเราได้ที่
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SOCIAL.map((s) => (
            <a
              key={s.label}
              href={s.href}
              className="card card-hover flex items-center gap-4 p-5"
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
    </div>
  );
}
