"use client";

import Link from "next/link";
import AdminTopBar from "@/components/admin/AdminTopBar";
import StatCard from "@/components/admin/StatCard";
import { useJobs } from "@/components/admin/JobContext";
import { useMappings } from "@/components/admin/MappingContext";
import { useStudents } from "@/components/admin/StudentContext";

// ── Config ────────────────────────────────────────────────────
const JOB_STATUS_COLOR = {
  เปิดรับ:  { bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
  เต็มแล้ว: { bar: "bg-blue-500",    badge: "bg-blue-100 text-blue-700" },
  ปิดรับ:   { bar: "bg-gray-400",    badge: "bg-gray-100 text-gray-600" },
};

const MAP_STATUS_COLOR = {
  สมัครแล้ว:          { bar: "bg-blue-500",    badge: "bg-blue-100 text-blue-700" },
  ผ่านการคัดเลือก:    { bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
  ไม่ผ่านการคัดเลือก: { bar: "bg-red-500",     badge: "bg-red-100 text-red-700" },
};

const TYPE_COLOR = {
  ฝึกงาน:   { bar: "bg-sky-500",    badge: "bg-sky-100 text-sky-700" },
  งานประจำ: { bar: "bg-violet-500", badge: "bg-violet-100 text-violet-700" },
};

const quickLinks = [
  { href: "/admin/marketplace/job-positions",      label: "ตำแหน่งงาน",     icon: "💼", desc: "ดู แก้ไข และเพิ่มตำแหน่งงาน" },
  { href: "/admin/marketplace/job-positions/new",  label: "เพิ่มตำแหน่งงาน", icon: "➕", desc: "ลงทะเบียนตำแหน่งงานใหม่" },
  { href: "/admin/marketplace/applications",       label: "ใบสมัคร",         icon: "🔗", desc: "จัดการใบสมัครและการจับคู่นักเรียน-งาน" },
  { href: "/admin/marketplace/internship-tracking", label: "ติดตามฝึกงาน",   icon: "📊", desc: "ติดตามสถานะและความคืบหน้าการฝึกงาน" },
];

// ── Shared UI ─────────────────────────────────────────────────
function BarRow({ label, count, total, colorClass, badge }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground truncate max-w-[60%]">{label}</span>
        <span className="text-muted shrink-0 ml-2">
          {badge && <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-semibold ${badge}`}>{pct}%</span>}
          {count.toLocaleString()} รายการ
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

// ── Page ──────────────────────────────────────────────────────
export default function MarketplaceDashboardPage() {
  const { jobs, ready: jobsReady }         = useJobs();
  const { mappings, ready: mappingsReady } = useMappings();
  const { students }                       = useStudents();

  if (!jobsReady || !mappingsReady) {
    return (
      <>
        <AdminTopBar title="Marketplace" description="ภาพรวม Marketplace" />
        <div className="flex items-center justify-center py-24 text-sm text-muted">กำลังโหลดข้อมูล...</div>
      </>
    );
  }

  // ── Job stats ────────────────────────────────────────────────
  const totalJobs   = jobs.length;
  const openJobs    = jobs.filter(j => j.status === "เปิดรับ").length;
  const closedJobs  = jobs.filter(j => j.status === "ปิดรับ").length;
  const fullJobs    = jobs.filter(j => j.status === "เต็มแล้ว").length;
  const totalSlots  = jobs.reduce((s, j) => s + (Number(j.slots) || 0), 0);
  const totalApps   = jobs.reduce((s, j) => s + (Number(j.applications) || 0), 0);

  const byJobStatus = Object.entries(
    jobs.reduce((acc, j) => ({ ...acc, [j.status]: (acc[j.status] || 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1]);

  const byType = Object.entries(
    jobs.reduce((acc, j) => ({ ...acc, [j.type]: (acc[j.type] || 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1]);

  const byField = Object.entries(
    jobs.reduce((acc, j) => ({ ...acc, [j.field]: (acc[j.field] || 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1]);

  // ── Mapping stats ────────────────────────────────────────────
  const totalMappings   = mappings.length;
  const passedMappings  = mappings.filter(m => m.status === "ผ่านการคัดเลือก").length;
  const appliedMappings = mappings.filter(m => m.status === "สมัครแล้ว").length;
  const placementRate   = totalMappings > 0 ? Math.round((passedMappings / totalMappings) * 100) : 0;

  const byMapStatus = Object.entries(
    mappings.reduce((acc, m) => ({ ...acc, [m.status]: (acc[m.status] || 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1]);

  // ── Students mapped vs unmapped ──────────────────────────────
  const mappedStudentIds = new Set(mappings.map(m => m.studentId));
  const mappedStudents   = students.filter(s => mappedStudentIds.has(s.id)).length;
  const unmappedStudents = students.length - mappedStudents;

  // ── Most active jobs (by application count) ──────────────────
  const topJobs = [...jobs]
    .filter(j => j.applications > 0)
    .sort((a, b) => (b.applications || 0) - (a.applications || 0))
    .slice(0, 5);

  // ── Recent mappings ──────────────────────────────────────────
  const recentMappings = [...mappings]
    .sort((a, b) => (b.appliedDate ?? "").localeCompare(a.appliedDate ?? ""))
    .slice(0, 6);

  return (
    <>
      <AdminTopBar
        title="Marketplace"
        description={`ภาพรวม — ตำแหน่งงาน ${totalJobs} ตำแหน่ง · Mapping ${totalMappings} รายการ`}
      />

      <div className="space-y-6 p-6">

        {/* ── 1. Stat Cards ── */}
        <div className="admin-stat-grid">
          <StatCard label="ตำแหน่งงานทั้งหมด"  value={totalJobs.toLocaleString()}    icon="💼" change={`เปิดรับ ${openJobs} · ปิดรับ ${closedJobs}`} />
          <StatCard label="ผู้สมัครทั้งหมด"     value={totalApps.toLocaleString()}    icon="📝" change={`จากทั้งหมด ${totalSlots} ที่นั่ง`} />
          <StatCard label="Mapping ทั้งหมด"      value={totalMappings.toLocaleString()} icon="🔗" change={`ผ่านการคัดเลือก ${passedMappings} ราย`} />
          <StatCard label="Placement Rate"        value={`${placementRate}%`}           icon="📈" change={`รอผล ${appliedMappings} ราย`} />
        </div>

        {/* ── 2. Job status + Mapping status ── */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Job status */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">สถานะตำแหน่งงาน</h2>
              <Link href="/admin/marketplace/job-positions" className="text-xs font-medium text-primary hover:underline">ดูทั้งหมด →</Link>
            </div>
            <div className="space-y-3">
              {byJobStatus.map(([status, count]) => (
                <BarRow key={status} label={status} count={count} total={totalJobs}
                  colorClass={JOB_STATUS_COLOR[status]?.bar ?? "bg-gray-400"}
                  badge={JOB_STATUS_COLOR[status]?.badge} />
              ))}
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2 pt-2 border-t border-border">
              {byJobStatus.map(([status, count]) => (
                <div key={status} className="text-center">
                  <div className="text-xl font-extrabold text-foreground">{count}</div>
                  <div className="text-[10px] text-muted leading-tight">{status}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mapping status */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">สถานะใบสมัคร</h2>
              <Link href="/admin/marketplace/applications" className="text-xs font-medium text-primary hover:underline">ดูทั้งหมด →</Link>
            </div>
            <div className="space-y-3">
              {byMapStatus.map(([status, count]) => (
                <BarRow key={status} label={status} count={count} total={totalMappings}
                  colorClass={MAP_STATUS_COLOR[status]?.bar ?? "bg-gray-400"}
                  badge={MAP_STATUS_COLOR[status]?.badge} />
              ))}
            </div>
          </div>
        </div>

        {/* ── 3. Job type + Field + Mini-stats ── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Type + Field bars */}
          <div className="card p-5 space-y-5 lg:col-span-2">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-3">
                <h2 className="font-semibold text-foreground">ประเภทตำแหน่งงาน</h2>
                {byType.map(([type, count]) => (
                  <BarRow key={type} label={type} count={count} total={totalJobs}
                    colorClass={TYPE_COLOR[type]?.bar ?? "bg-gray-400"}
                    badge={TYPE_COLOR[type]?.badge} />
                ))}
              </div>
              <div className="space-y-3">
                <h2 className="font-semibold text-foreground">สาขาวิชา</h2>
                {byField.slice(0, 6).map(([field, count], i) => (
                  <BarRow key={field} label={field} count={count} total={totalJobs}
                    colorClass={["bg-primary","bg-sky-500","bg-violet-500","bg-emerald-500","bg-amber-500","bg-rose-500"][i % 6]} />
                ))}
              </div>
            </div>
          </div>

          {/* Mini-stats */}
          <div className="space-y-3">
            <h2 className="font-semibold text-foreground text-sm">สรุปตัวเลขสำคัญ</h2>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="ตำแหน่งเต็มแล้ว"   value={fullJobs}         sub="ตำแหน่ง"    color="border-blue-500" />
              <MiniStat label="ปิดรับแล้ว"         value={closedJobs}       sub="ตำแหน่ง"    color="border-gray-400" />
              <MiniStat label="ที่นั่งทั้งหมด"     value={totalSlots}       sub="ที่นั่ง"    color="border-primary" />
              <MiniStat label="ที่นั่งเฉลี่ย/งาน"  value={totalJobs > 0 ? Math.round(totalSlots/totalJobs) : 0} sub="ที่นั่ง" color="border-violet-500" />
              <MiniStat label="นักเรียนมี Mapping"  value={mappedStudents}   sub="คน"         color="border-emerald-500" />
              <MiniStat label="ยังไม่มี Mapping"    value={unmappedStudents} sub="คน"         color="border-amber-400" />
            </div>

            {/* Mapped vs Unmapped bar */}
            <div className="card p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground">สัดส่วนนักเรียนที่ถูก Map</p>
              <div className="flex h-4 overflow-hidden rounded-full">
                <div className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${students.length > 0 ? Math.round(mappedStudents / students.length * 100) : 0}%` }} />
                <div className="bg-surface-muted transition-all duration-500 flex-1" />
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  มี Mapping <span className="font-semibold text-foreground ml-1">{mappedStudents}</span> คน
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-surface-muted border border-border" />
                  ยังไม่มี <span className="font-semibold text-foreground ml-1">{unmappedStudents}</span> คน
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Top jobs by applications ── */}
        {topJobs.length > 0 && (
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">🏆 ตำแหน่งงานที่มีผู้สมัครมากที่สุด</h2>
              <Link href="/admin/marketplace/job-positions" className="text-xs font-medium text-primary hover:underline">ดูทั้งหมด →</Link>
            </div>
            <div className="space-y-2">
              {topJobs.map((j, i) => {
                const pct = j.slots > 0 ? Math.min(Math.round((j.applications / j.slots) * 100), 100) : 0;
                return (
                  <Link key={j.id} href={`/admin/marketplace/job-positions/${j.id}`}
                    className="flex items-center gap-4 rounded-xl border border-border px-4 py-3 hover:border-primary hover:bg-accent-soft/30 transition-colors">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-primary">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground truncate">{j.title}</p>
                        <span className="shrink-0 text-xs text-muted">{j.applications}/{j.slots || "—"} คน</span>
                      </div>
                      <p className="text-xs text-muted truncate mb-1.5">{j.companyName} · {j.type}</p>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                        <div className="h-1.5 rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${JOB_STATUS_COLOR[j.status]?.badge ?? "bg-gray-100 text-gray-600"}`}>
                      {j.status}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 5. Recent mappings ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Mapping ล่าสุด</h2>
            <Link href="/admin/marketplace/applications" className="text-xs font-medium text-primary hover:underline">ดูทั้งหมด →</Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted">
                  {["รหัส", "นักเรียน", "ตำแหน่งงาน", "วันที่สมัคร", "สถานะ"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentMappings.map((m, i) => {
                  const s   = students.find(x => x.id === m.studentId);
                  const j   = jobs.find(x => x.id === m.jobId);
                  const cfg = MAP_STATUS_COLOR[m.status];
                  return (
                    <tr key={m.id}
                      onClick={() => window.location.href = `/admin/marketplace/applications/${m.id}`}
                      className={`cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-accent-soft ${i % 2 !== 0 ? "bg-surface-muted/40" : ""}`}>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted">{m.id}</td>
                      <td className="px-4 py-2.5 font-medium text-foreground">
                        {s ? `${s.prefix}${s.name} ${s.lastname}` : m.studentId}
                      </td>
                      <td className="px-4 py-2.5 text-muted">
                        <p className="truncate max-w-[180px]">{j?.title ?? m.jobId}</p>
                        {j && <p className="text-[11px] text-muted/70 truncate max-w-[180px]">{j.companyName}</p>}
                      </td>
                      <td className="px-4 py-2.5 text-muted text-xs">
                        {m.appliedDate ? new Date(m.appliedDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg?.badge ?? "bg-gray-100 text-gray-600"}`}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 6. Quick links ── */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">จัดการ Marketplace</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map(link => (
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
