"use client";

import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import StatCard from "@/components/admin/ui/StatCard";
import Link from "next/link";
import { useStudents } from "@/components/admin/contexts/StudentContext";

const STATUS_COLOR = {
  กำลังศึกษา: { bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
  ฝึกงาน:     { bar: "bg-blue-500",    badge: "bg-blue-100 text-blue-700" },
  จบการศึกษา: { bar: "bg-gray-400",    badge: "bg-gray-100 text-gray-600" },
  พักการเรียน:{ bar: "bg-amber-400",   badge: "bg-amber-100 text-amber-700" },
  พ้นสภาพ:    { bar: "bg-red-500",     badge: "bg-red-100 text-red-700" },
};

const UNI_COLOR = ["bg-primary", "bg-sky-500", "bg-violet-500", "bg-amber-500", "bg-emerald-500"];

function BarRow({ label, count, total, colorClass, badge }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground truncate max-w-[60%]">{label}</span>
        <span className="text-muted shrink-0 ml-2">
          {badge && (
            <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-semibold ${badge}`}>{pct}%</span>
          )}
          {count.toLocaleString()} คน
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div className={`h-2 rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub, color }) {
  return (
    <div className={`rounded-xl border-l-4 ${color} bg-surface px-4 py-3`}>
      <p className="text-2xl font-extrabold text-foreground">{value}</p>
      <p className="text-xs font-semibold text-foreground">{label}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

const quickLinks = [
  { href: "/admin/students/list",     label: "รายชื่อนักศึกษา",   icon: "👥", desc: "ค้นหาและจัดการข้อมูล" },
  { href: "/admin/students/new",      label: "เพิ่มนักศึกษา",     icon: "➕", desc: "ลงทะเบียนนักศึกษาใหม่" },
  { href: "/admin/students/scholarship", label: "ทุนการศึกษา",   icon: "🏆", desc: "จัดการทุนและผู้รับทุน" },
  { href: "/admin/students/documents",label: "เอกสาร",            icon: "📄", desc: "ตรวจสอบและอนุมัติ" },
];

export default function StudentDashboardPage() {
  const { students, ready } = useStudents();

  if (!ready) {
    return (
      <>
        <AdminTopBar title="Student Management" description="ภาพรวมนักศึกษา" />
        <div className="flex items-center justify-center py-24 text-muted text-sm">กำลังโหลดข้อมูล...</div>
      </>
    );
  }

  const total = students.length;

  // ── Status breakdown ────────────────────────────────────────
  const byStatus = Object.entries(
    students.reduce((acc, s) => ({ ...acc, [s.status]: (acc[s.status] || 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1]);

  // ── University breakdown ────────────────────────────────────
  const byUniversity = Object.entries(
    students.reduce((acc, s) => ({ ...acc, [s.university]: (acc[s.university] || 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1]);

  // ── Year breakdown ──────────────────────────────────────────
  const byYear = [1, 2, 3, 4, 5].map((y) => ({
    year: y,
    count: students.filter((s) => s.year === String(y)).length,
  }));

  // ── Gender ─────────────────────────────────────────────────
  const male   = students.filter((s) => s.prefix === "นาย").length;
  const female = students.filter((s) => s.prefix === "นางสาว" || s.prefix === "นาง").length;

  // ── Key status counts ───────────────────────────────────────
  const studying    = students.filter((s) => s.status === "กำลังศึกษา").length;
  const internship  = students.filter((s) => s.status === "ฝึกงาน").length;
  const graduated   = students.filter((s) => s.status === "จบการศึกษา").length;
  const onLeave     = students.filter((s) => s.status === "พักการเรียน").length;
  const expelled    = students.filter((s) => s.status === "พ้นสภาพ").length;

  // ── Internship students with notes ─────────────────────────
  const internStudents = students.filter((s) => s.status === "ฝึกงาน").slice(0, 5);

  // ── Recent additions (last 5) ───────────────────────────────
  const recentStudents = [...students].slice(-5).reverse();

  return (
    <>
      <AdminTopBar
        title="Student Management"
        description={`ภาพรวมนักศึกษาทั้งหมด ${total} คน — อัปเดตจากข้อมูลจริงในระบบ`}
      />

      <div className="space-y-6 p-6">

        {/* ── 1. Stat Cards ── */}
        <div className="admin-stat-grid">
          <StatCard label="นักศึกษาทั้งหมด"  value={total.toLocaleString()}    change="ทั้งหมดในระบบ"                               icon="🎓" />
          <StatCard label="กำลังศึกษา"        value={studying.toLocaleString()}  change={`${Math.round(studying/total*100)}% ของทั้งหมด`} icon="📚" />
          <StatCard label="ฝึกงาน"            value={internship.toLocaleString()} change="ออกฝึกงานอยู่ในขณะนี้"                      icon="🏢" />
          <StatCard label="จบการศึกษาแล้ว"   value={graduated.toLocaleString()}  change={`${Math.round(graduated/total*100)}% ของทั้งหมด`} icon="🏆" />
        </div>

        {/* ── 2. Status + Year ── */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Status distribution */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">สถานะนักศึกษา</h2>
              <span className="text-xs text-muted">{total} คนทั้งหมด</span>
            </div>
            <div className="space-y-3">
              {byStatus.map(([status, count]) => (
                <BarRow
                  key={status}
                  label={status}
                  count={count}
                  total={total}
                  colorClass={STATUS_COLOR[status]?.bar ?? "bg-gray-400"}
                  badge={STATUS_COLOR[status]?.badge}
                />
              ))}
            </div>
          </div>

          {/* Year distribution */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">นักศึกษาแยกตามชั้นปี</h2>
              <span className="text-xs text-muted">ปี 1–5</span>
            </div>
            <div className="space-y-3">
              {byYear.map(({ year, count }) => (
                <BarRow
                  key={year}
                  label={`ปีที่ ${year}`}
                  count={count}
                  total={total}
                  colorClass="bg-primary"
                />
              ))}
            </div>
            {/* Donut-style summary */}
            <div className="mt-2 grid grid-cols-5 gap-2 pt-2 border-t border-border">
              {byYear.map(({ year, count }) => (
                <div key={year} className="text-center">
                  <div className="text-lg font-extrabold text-primary">{count}</div>
                  <div className="text-xs text-muted">ปี {year}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 3. University + Gender ── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* University distribution */}
          <div className="card p-5 space-y-4 lg:col-span-2">
            <h2 className="font-semibold text-foreground">นักศึกษาแยกตามมหาวิทยาลัย</h2>
            <div className="space-y-3">
              {byUniversity.map(([uni, count], i) => (
                <BarRow
                  key={uni}
                  label={uni}
                  count={count}
                  total={total}
                  colorClass={UNI_COLOR[i % UNI_COLOR.length]}
                />
              ))}
            </div>
          </div>

          {/* Gender + mini-stats */}
          <div className="space-y-4">
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-foreground">สัดส่วนเพศ</h2>
              <div className="flex h-5 overflow-hidden rounded-full">
                <div
                  className="bg-blue-500 transition-all duration-500"
                  style={{ width: `${Math.round(male / total * 100)}%` }}
                  title={`ชาย ${male} คน`}
                />
                <div
                  className="bg-pink-400 transition-all duration-500"
                  style={{ width: `${Math.round(female / total * 100)}%` }}
                  title={`หญิง ${female} คน`}
                />
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-muted">ชาย <span className="font-semibold text-foreground">{male}</span> คน ({Math.round(male/total*100)}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-pink-400 shrink-0" />
                  <span className="text-muted">หญิง <span className="font-semibold text-foreground">{female}</span> คน ({Math.round(female/total*100)}%)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="พักการเรียน" value={onLeave}   sub="คน" color="border-amber-400" />
              <MiniStat label="พ้นสภาพ"     value={expelled}  sub="คน" color="border-red-500" />
              <MiniStat label="สาขาที่มี"   value={byUniversity.length} sub="สาขา" color="border-primary" />
              <MiniStat label="ชั้นปีสูงสุด" value={`ปี ${byYear.findIndex(y=>y.count===Math.max(...byYear.map(y=>y.count)))+1}`} sub="มากที่สุด" color="border-violet-500" />
            </div>
          </div>
        </div>

        {/* ── 4. Internship spotlight ── */}
        {internStudents.length > 0 && (
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">🏢 นักศึกษาที่กำลังฝึกงาน</h2>
              <Link href="/admin/students/list" className="text-xs font-medium text-primary hover:underline">
                ดูทั้งหมด →
              </Link>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {internStudents.map((s) => (
                <Link
                  key={s.id}
                  href={`/admin/students/${s.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 hover:border-primary hover:bg-accent-soft/30 transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                    {s.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{s.prefix}{s.name} {s.lastname}</p>
                    <p className="truncate text-xs text-muted">{s.note || s.university}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── 5. Recent students ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">นักศึกษาล่าสุดในระบบ</h2>
            <Link href="/admin/students/list" className="text-xs font-medium text-primary hover:underline">ดูทั้งหมด →</Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted">
                  {["รหัส", "ชื่อ-นามสกุล", "สาขา"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted">{h}</th>
                  ))}
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted">ปี</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.map((s, i) => (
                  <tr
                    key={s.id}
                    onClick={() => window.location.href = `/admin/students/${s.id}`}
                    className={`cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-accent-soft ${i % 2 === 0 ? "" : "bg-surface-muted/40"}`}
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-muted">{s.id}</td>
                    <td className="px-4 py-2.5 font-medium text-foreground">{s.prefix}{s.name} {s.lastname}</td>
                    <td className="px-4 py-2.5 text-muted">{s.university}</td>
                    <td className="px-4 py-2.5 text-center text-muted">{s.year}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[s.status]?.badge ?? "bg-gray-100 text-gray-600"}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 6. Quick links ── */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">จัดการนักศึกษา</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="card flex flex-col gap-2 p-4 transition-shadow hover:shadow-md">
                <span className="text-2xl">{link.icon}</span>
                <span className="font-semibold text-sm text-foreground">{link.label}</span>
                <span className="text-xs text-muted leading-snug">{link.desc}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
