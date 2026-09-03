"use client";

import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import StatCard from "@/components/admin/ui/StatCard";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStudents } from "@/components/admin/contexts/StudentContext";

const FILTER_KEY = "student-list-filters";

// ── สีสถานะ ─────────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  กำลังศึกษา: { bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
  ฝึกงาน:     { bar: "bg-blue-500",    badge: "bg-blue-100 text-blue-700" },
  จบการศึกษา: { bar: "bg-gray-400",    badge: "bg-gray-100 text-gray-600" },
  พักการเรียน:{ bar: "bg-amber-400",   badge: "bg-amber-100 text-amber-700" },
  พ้นสภาพ:    { bar: "bg-red-500",     badge: "bg-red-100 text-red-700" },
};

// สี KOSEN universities (ตรงกับ MappingListClient)
const KOSEN_UNI_COLORS = {
  "KOSEN-KMUTT":      { bar: "bg-blue-500",   badge: "bg-blue-100 text-blue-700" },
  "KOSEN-KMITL":      { bar: "bg-violet-500", badge: "bg-violet-100 text-violet-700" },
  "KOSEN-Chulabhorn": { bar: "bg-rose-500",   badge: "bg-rose-100 text-rose-700" },
};
const JP_UNI_COLOR = { bar: "bg-amber-500", badge: "bg-amber-100 text-amber-700" };
const OTHER_UNI_COLOR = { bar: "bg-gray-400", badge: "bg-gray-100 text-gray-600" };

// สีประเภททุน (bar + badge)
const SCHOL_PALETTE = [
  { bar: "bg-primary",      badge: "bg-accent-soft text-primary" },
  { bar: "bg-emerald-500",  badge: "bg-emerald-100 text-emerald-700" },
  { bar: "bg-violet-500",   badge: "bg-violet-100 text-violet-700" },
  { bar: "bg-amber-500",    badge: "bg-amber-100 text-amber-700" },
  { bar: "bg-sky-500",      badge: "bg-sky-100 text-sky-700" },
  { bar: "bg-rose-500",     badge: "bg-rose-100 text-rose-700" },
];

// ── utilities ────────────────────────────────────────────────────────────────

/** ดึงมหาลัยปัจจุบันของนักศึกษา (endDate == null → ปัจจุบัน; ถ้าไม่มี ใช้ enrollment ล่าสุด) */
function getCurrentUniversity(student) {
  const enrs = student.enrollments;
  if (!enrs || enrs.length === 0) return null;
  const cur = enrs.find((e) => e.endDate == null);
  return (cur ?? enrs[enrs.length - 1]).university || null;
}

/** ดึงมหาลัยต้นสังกัด KOSEN (enrollment ที่เป็น KOSEN-*) */
function getKosenOrigin(student) {
  const enrs = student.enrollments ?? [];
  const kosen = enrs.find((e) => e.university?.startsWith("KOSEN-"));
  return kosen?.university ?? null;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function BarRow({ label, count, total, colorClass, badge, subLabel }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm gap-2">
        <div className="min-w-0">
          <span className="font-medium text-foreground truncate block">{label}</span>
          {subLabel && <span className="text-xs text-muted">{subLabel}</span>}
        </div>
        <span className="text-muted shrink-0 flex items-center gap-1.5">
          {badge && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge}`}>{pct}%</span>
          )}
          <span className="text-xs font-semibold text-foreground">{count.toLocaleString()} คน</span>
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

/** Badge สี KOSEN ─ ใช้ใน origin breakdown */
function KosenBadge({ uni, count }) {
  const c = KOSEN_UNI_COLORS[uni] ?? OTHER_UNI_COLOR;
  const short = uni.replace("KOSEN-", "");
  return (
    <div className={`rounded-xl border px-4 py-3 flex items-center justify-between ${c.badge.replace("text-", "border-").replace("bg-", "border-").split(" ")[0]} bg-surface`}>
      <div>
        <p className="text-xl font-extrabold text-foreground">{count}</p>
        <p className="text-xs font-semibold text-muted">{short}</p>
      </div>
      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${c.badge}`}>{uni}</span>
    </div>
  );
}

const quickLinks = [
  { href: "/admin/students/list", label: "รายชื่อนักศึกษา", icon: "👥", desc: "ค้นหาและจัดการข้อมูล" },
  { href: "/admin/students/new",  label: "เพิ่มนักศึกษา",   icon: "➕", desc: "ลงทะเบียนนักศึกษาใหม่" },
];

// ── Main Page ────────────────────────────────────────────────────────────────

export default function StudentDashboardPage() {
  const { students, ready } = useStudents();
  const [scholarshipTypes, setScholarshipTypes] = useState([]);
  const router = useRouter();

  /** เขียน filter ลง sessionStorage แล้ว navigate ไปหน้า list */
  const goWithFilter = useCallback((overrides) => {
    try {
      const current = JSON.parse(sessionStorage.getItem(FILTER_KEY)) ?? {};
      sessionStorage.setItem(FILTER_KEY, JSON.stringify({ ...current, ...overrides }));
    } catch {
      /* ignore */
    }
    router.push("/admin/students/list");
  }, [router]);

  // fetch ประเภททุนครั้งเดียวตอน mount
  useEffect(() => {
    fetch("/api/scholarship-types")
      .then((r) => r.json())
      .then(setScholarshipTypes)
      .catch(() => {});
  }, []);

  if (!ready) {
    return (
      <>
        <AdminTopBar title="Student Management" description="ภาพรวมนักศึกษา" />
        <div className="flex items-center justify-center py-24 text-muted text-sm">กำลังโหลดข้อมูล...</div>
      </>
    );
  }

  const total = students.length;

  // ── Status breakdown ────────────────────────────────────────────────────────
  const byStatus = Object.entries(
    students.reduce((acc, s) => ({ ...acc, [s.status]: (acc[s.status] || 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1]);

  // ── Scholarship type breakdown ──────────────────────────────────────────────
  const byScholarship = scholarshipTypes
    .map((type, i) => ({
      ...type,
      count: students.filter((s) => s.scholarshipTypeId === type.id).length,
      bar:   SCHOL_PALETTE[i % SCHOL_PALETTE.length].bar,
      badge: SCHOL_PALETTE[i % SCHOL_PALETTE.length].badge,
    }))
    .sort((a, b) => b.count - a.count);
  const noScholarship = students.filter((s) => !s.scholarshipTypeId).length;

  // ── University breakdown (จาก enrollment ปัจจุบัน) ─────────────────────────
  const uniMap = {};
  students.forEach((s) => {
    const uni = getCurrentUniversity(s);
    if (uni) uniMap[uni] = (uniMap[uni] || 0) + 1;
  });
  const byUniversity = Object.entries(uniMap).sort((a, b) => b[1] - a[1]);

  // แยก KOSEN / ญี่ปุ่น / อื่นๆ
  const kosenUnis   = byUniversity.filter(([u]) => u.startsWith("KOSEN-"));
  const jpUnis      = byUniversity.filter(([u]) => !u.startsWith("KOSEN-") && !u.startsWith("KMUTT-") && u !== "");
  const topJpUnis   = jpUnis.slice(0, 8);

  // ── KOSEN origin (มหาลัยต้นสังกัด) ─────────────────────────────────────────
  const kosenOriginMap = {};
  students.forEach((s) => {
    const k = getKosenOrigin(s);
    if (k) kosenOriginMap[k] = (kosenOriginMap[k] || 0) + 1;
  });
  const kosenOrigins = Object.entries(kosenOriginMap).sort((a, b) => b[1] - a[1]);

  // ── Year breakdown ──────────────────────────────────────────────────────────
  const byYear = [1, 2, 3, 4, 5].map((y) => ({
    year: y,
    count: students.filter((s) => {
      const enrs = s.enrollments ?? [];
      const cur = enrs.find((e) => e.endDate == null) ?? enrs[enrs.length - 1];
      return cur?.year === String(y);
    }).length,
  }));

  // ── Gender ─────────────────────────────────────────────────────────────────
  const male   = students.filter((s) => s.prefix === "นาย").length;
  const female = students.filter((s) => s.prefix === "นางสาว" || s.prefix === "นาง").length;

  // ── Key status counts ───────────────────────────────────────────────────────
  const studying   = students.filter((s) => s.status === "กำลังศึกษา").length;
  const internship = students.filter((s) => s.status === "ฝึกงาน").length;
  const graduated  = students.filter((s) => s.status === "จบการศึกษา").length;
  const onLeave    = students.filter((s) => s.status === "พักการเรียน").length;
  const expelled   = students.filter((s) => s.status === "พ้นสภาพ").length;

  // ── Students currently in Japan (อยู่ญี่ปุ่น = มี enrollment ปัจจุบันที่ไม่ใช่ KOSEN) ────
  const inJapan = students.filter((s) => {
    const u = getCurrentUniversity(s);
    return u && !u.startsWith("KOSEN-") && !u.startsWith("KMUTT-");
  }).length;

  // ── Internship spotlight ────────────────────────────────────────────────────
  const internStudents = students.filter((s) => s.status === "ฝึกงาน").slice(0, 6);

  // ── Recent students ─────────────────────────────────────────────────────────
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
          <StatCard label="นักศึกษาทั้งหมด"  value={total.toLocaleString()}       change="ทั้งหมดในระบบ"                                 icon="🎓" />
          <StatCard label="กำลังศึกษา"        value={studying.toLocaleString()}    change={`${Math.round(studying/total*100||0)}% ของทั้งหมด`} icon="📚" />
          <StatCard label="อยู่ที่ญี่ปุ่น"    value={inJapan.toLocaleString()}     change="enrollment ปัจจุบันที่มหาลัยญี่ปุ่น"          icon="🗾" />
          <StatCard label="จบการศึกษาแล้ว"   value={graduated.toLocaleString()}   change={`${Math.round(graduated/total*100||0)}% ของทั้งหมด`} icon="🏆" />
        </div>

        {/* ── 2. Status + Year ── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Status */}
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

          {/* Year */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">นักศึกษาแยกตามชั้นปี</h2>
              <span className="text-xs text-muted">ชั้นปีปัจจุบัน</span>
            </div>
            <div className="space-y-3">
              {byYear.map(({ year, count }) => (
                <BarRow
                  key={year}
                  label={`ชั้นปีที่ ${year}`}
                  count={count}
                  total={total}
                  colorClass="bg-primary"
                />
              ))}
            </div>
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

        {/* ── 3. Scholarship Type breakdown ── */}
        {byScholarship.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="card p-5 space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground">นักศึกษาแยกตามประเภททุน</h2>
                <span className="text-xs text-muted">
                  {students.filter((s) => s.scholarshipTypeId).length} คนได้รับทุน
                </span>
              </div>
              <div className="space-y-3">
                {byScholarship.map((type) => (
                  <BarRow
                    key={type.id}
                    label={`${type.icon ?? ""} ${type.name}`.trim()}
                    count={type.count}
                    total={total}
                    colorClass={type.bar}
                    badge={type.badge}
                    subLabel={type.coverage ?? ""}
                  />
                ))}
                {noScholarship > 0 && (
                  <BarRow
                    label="ไม่ระบุทุน / ทุนตนเอง"
                    count={noScholarship}
                    total={total}
                    colorClass="bg-gray-300"
                    badge="bg-gray-100 text-gray-500"
                  />
                )}
              </div>
            </div>

            {/* Scholarship summary tiles */}
            <div className="space-y-3">
              <div className="card p-5 space-y-3">
                <h2 className="font-semibold text-foreground text-sm">สรุปทุนการศึกษา</h2>
                <div className="grid grid-cols-2 gap-2">
                  {byScholarship.map((type, i) => (
                    <div
                      key={type.id}
                      className="rounded-xl bg-surface-muted px-3 py-2.5 text-center"
                    >
                      <p className="text-xl font-extrabold text-foreground">{type.count}</p>
                      <p className="text-xs text-muted truncate">{type.icon} {type.name}</p>
                    </div>
                  ))}
                  {noScholarship > 0 && (
                    <div className="rounded-xl bg-surface-muted px-3 py-2.5 text-center">
                      <p className="text-xl font-extrabold text-foreground">{noScholarship}</p>
                      <p className="text-xs text-muted">ไม่ระบุ</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Gender */}
              <div className="card p-5 space-y-3">
                <h2 className="font-semibold text-foreground text-sm">สัดส่วนเพศ</h2>
                <div className="flex h-4 overflow-hidden rounded-full">
                  <div
                    className="bg-blue-500 transition-all duration-500"
                    style={{ width: `${total > 0 ? Math.round(male / total * 100) : 0}%` }}
                    title={`ชาย ${male} คน`}
                  />
                  <div
                    className="bg-pink-400 transition-all duration-500"
                    style={{ width: `${total > 0 ? Math.round(female / total * 100) : 0}%` }}
                    title={`หญิง ${female} คน`}
                  />
                </div>
                <div className="space-y-1 text-xs text-muted">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0" />
                    ชาย <span className="font-semibold text-foreground">{male}</span> คน ({total > 0 ? Math.round(male/total*100) : 0}%)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-pink-400 shrink-0" />
                    หญิง <span className="font-semibold text-foreground">{female}</span> คน ({total > 0 ? Math.round(female/total*100) : 0}%)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 4. University breakdown ── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* มหาลัยปัจจุบัน (ญี่ปุ่น) */}
          <div className="card p-5 space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">มหาวิทยาลัยปัจจุบัน (ญี่ปุ่น)</h2>
              <span className="text-xs text-muted">
                enrollment ล่าสุด · {inJapan} คน
              </span>
            </div>
            {topJpUnis.length > 0 ? (
              <div className="space-y-3">
                {topJpUnis.map(([uni, count]) => (
                  <BarRow
                    key={uni}
                    label={uni}
                    count={count}
                    total={total}
                    colorClass={JP_UNI_COLOR.bar}
                    badge={JP_UNI_COLOR.badge}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted py-4 text-center">ยังไม่มีข้อมูล enrollment ที่มหาวิทยาลัยญี่ปุ่น</p>
            )}
          </div>

          {/* KOSEN origin + mini stats */}
          <div className="space-y-4">
            {/* KOSEN origin breakdown */}
            <div className="card p-5 space-y-3">
              <h2 className="font-semibold text-foreground text-sm">ต้นสังกัด KOSEN</h2>
              {kosenOrigins.length > 0 ? (
                <div className="space-y-2">
                  {kosenOrigins.map(([uni, count]) => {
                    const c = KOSEN_UNI_COLORS[uni] ?? OTHER_UNI_COLOR;
                    const short = uni.replace("KOSEN-", "");
                    return (
                      <div key={uni} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="mb-1 flex items-center justify-between text-xs gap-1">
                            <span className="font-medium text-foreground truncate">{short}</span>
                            <span className="text-muted shrink-0 font-semibold">{count} คน</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${c.bar}`}
                              style={{ width: `${total > 0 ? Math.round(count / total * 100) : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted">ไม่พบข้อมูล KOSEN enrollment</p>
              )}
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="ฝึกงาน"     value={internship} sub="คน" color="border-blue-500" />
              <MiniStat label="พักการเรียน" value={onLeave}    sub="คน" color="border-amber-400" />
              <MiniStat label="พ้นสภาพ"     value={expelled}   sub="คน" color="border-red-500" />
              <MiniStat label="มหาลัยญี่ปุ่น" value={topJpUnis.length} sub="แห่ง" color="border-violet-500" />
            </div>
          </div>
        </div>

        {/* ── 5. Cross-breakdown: Scholarship × KOSEN origin ── */}
        {kosenOrigins.length > 0 && byScholarship.length > 0 && (
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-foreground">ประเภททุน × ต้นสังกัด KOSEN</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 text-left text-xs font-semibold text-muted w-40">ประเภททุน</th>
                    {kosenOrigins.map(([uni]) => (
                      <th key={uni} className="py-2 px-3 text-center text-xs font-semibold text-muted">
                        <span className={`rounded-full px-2 py-0.5 ${(KOSEN_UNI_COLORS[uni] ?? OTHER_UNI_COLOR).badge}`}>
                          {uni.replace("KOSEN-", "")}
                        </span>
                      </th>
                    ))}
                    <th className="py-2 px-3 text-center text-xs font-semibold text-muted">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {byScholarship.map((type) => {
                    const kosenCounts = kosenOrigins.map(([uni]) =>
                      students.filter((s) => s.scholarshipTypeId === type.id && getKosenOrigin(s) === uni).length
                    );
                    return (
                      <tr key={type.id} className="border-b border-border last:border-0 hover:bg-surface-muted/50">
                        <td className="py-2.5 text-sm font-medium text-foreground">{type.icon} {type.name}</td>
                        {kosenCounts.map((c, i) => (
                          <td key={i} className="py-2.5 px-3 text-center font-semibold text-foreground">{c}</td>
                        ))}
                        <td className="py-2.5 px-3 text-center font-bold text-primary">{type.count}</td>
                      </tr>
                    );
                  })}
                  {noScholarship > 0 && (
                    <tr className="border-b border-border last:border-0 text-muted">
                      <td className="py-2.5 text-sm">ไม่ระบุ / ทุนตนเอง</td>
                      {kosenOrigins.map(([uni]) => {
                        const c = students.filter((s) => !s.scholarshipTypeId && getKosenOrigin(s) === uni).length;
                        return <td key={uni} className="py-2.5 px-3 text-center">{c}</td>;
                      })}
                      <td className="py-2.5 px-3 text-center font-bold">{noScholarship}</td>
                    </tr>
                  )}
                  {/* รวม row */}
                  <tr className="bg-surface-muted">
                    <td className="py-2.5 text-xs font-semibold text-muted uppercase tracking-wide">รวมทั้งหมด</td>
                    {kosenOrigins.map(([uni]) => {
                      const c = students.filter((s) => getKosenOrigin(s) === uni).length;
                      return <td key={uni} className="py-2.5 px-3 text-center font-bold text-foreground">{c}</td>;
                    })}
                    <td className="py-2.5 px-3 text-center font-bold text-foreground">{total}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 6. Internship spotlight ── */}
        {internStudents.length > 0 && (
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">🏢 นักศึกษาที่กำลังฝึกงาน</h2>
              <button
                onClick={() => goWithFilter({ filterStatus: "ฝึกงาน" })}
                className="text-xs font-medium text-primary hover:underline"
              >
                ดูทั้งหมด ({internship} คน) →
              </button>
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
                    <p className="truncate text-xs text-muted">{getCurrentUniversity(s) || s.note || "—"}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── 7. Recent students ── */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">🎓 นักศึกษาล่าสุดในระบบ</h2>
            <button
              onClick={() => goWithFilter({ sortBy: "newest" })}
              className="text-xs font-medium text-primary hover:underline"
            >
              ดูทั้งหมด ({total}) →
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recentStudents.map((s) => {
              const uni   = getCurrentUniversity(s);
              const schol = scholarshipTypes.find((t) => t.id === s.scholarshipTypeId);
              return (
                <Link
                  key={s.id}
                  href={`/admin/students/${s.id}`}
                  className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3 hover:border-primary hover:bg-accent-soft/30 transition-colors"
                >
                  {/* Avatar + ชื่อ + สถานะ */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                        {s.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {s.prefix}{s.name} {s.lastname}
                        </p>
                        <p className="font-mono text-[10px] text-muted">{s.id}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLOR[s.status]?.badge ?? "bg-gray-100 text-gray-600"}`}>
                      {s.status}
                    </span>
                  </div>
                  {/* มหาวิทยาลัย */}
                  {uni && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] text-muted shrink-0">🏫</span>
                      <p className="truncate text-xs text-muted">{uni}</p>
                    </div>
                  )}
                  {/* ประเภททุน */}
                  {schol && (
                    <p className="truncate text-xs text-foreground">{schol.name}</p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── 8. Quick links ── */}
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
