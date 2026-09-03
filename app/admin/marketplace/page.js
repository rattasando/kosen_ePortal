"use client";

import Link from "next/link";
import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import StatCard from "@/components/admin/ui/StatCard";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useJobs }     from "@/components/admin/contexts/JobContext";
import { useMappings } from "@/components/admin/contexts/MappingContext";
import { useStudents } from "@/components/admin/contexts/StudentContext";

// ── sessionStorage filter keys (ตรงกับ list clients) ────────────────────────
const JOB_FILTER_KEY     = "job-list-filters";
const MAPPING_FILTER_KEY = "mapping-list-filters";

// ── สีสถานะงาน ───────────────────────────────────────────────────────────────
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

// สีอุตสาหกรรม (วน)
const INDUSTRY_PALETTE = [
  { bar: "bg-primary",     badge: "bg-accent-soft text-primary" },
  { bar: "bg-sky-500",     badge: "bg-sky-100 text-sky-700" },
  { bar: "bg-violet-500",  badge: "bg-violet-100 text-violet-700" },
  { bar: "bg-amber-500",   badge: "bg-amber-100 text-amber-700" },
  { bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
  { bar: "bg-rose-500",    badge: "bg-rose-100 text-rose-700" },
  { bar: "bg-cyan-500",    badge: "bg-cyan-100 text-cyan-700" },
  { bar: "bg-orange-500",  badge: "bg-orange-100 text-orange-700" },
];

// ── Sub-components ───────────────────────────────────────────────────────────

function BarRow({ label, count, total, colorClass, badge, unit = "รายการ", subLabel }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm gap-2">
        <div className="min-w-0">
          <span className="font-medium text-foreground truncate block">{label}</span>
          {subLabel && <span className="text-xs text-muted">{subLabel}</span>}
        </div>
        <span className="text-muted shrink-0 flex items-center gap-1.5">
          {badge && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge}`}>{pct}%</span>}
          <span className="text-xs font-semibold text-foreground">{count.toLocaleString()} {unit}</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div className={`h-2 rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}


const quickLinks = [
  { href: "/admin/marketplace/job-positions",  label: "ตำแหน่งงาน",      icon: "💼", desc: "ดู แก้ไข และเพิ่มตำแหน่งงาน" },
  { href: "/admin/marketplace/job-positions/new", label: "เพิ่มตำแหน่งงาน", icon: "➕", desc: "ลงทะเบียนตำแหน่งงานใหม่" },
  { href: "/admin/marketplace/applications",   label: "ใบสมัคร",           icon: "🔗", desc: "จัดการใบสมัครและการจับคู่" },
];

// ── Main Page ────────────────────────────────────────────────────────────────

export default function MarketplaceDashboardPage() {
  const { jobs,     ready: jobsReady }     = useJobs();
  const { mappings, ready: mappingsReady } = useMappings();
  const { students }                       = useStudents();
  const [companies, setCompanies]          = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/companies").then(r => r.json()).then(setCompanies).catch(() => {});
  }, []);

  /** เขียน filter ลง sessionStorage แล้ว navigate */
  const goJobFilter = useCallback((overrides) => {
    try {
      const cur = JSON.parse(sessionStorage.getItem(JOB_FILTER_KEY)) ?? {};
      sessionStorage.setItem(JOB_FILTER_KEY, JSON.stringify({ ...cur, ...overrides }));
    } catch { /* ignore */ }
    router.push("/admin/marketplace/job-positions");
  }, [router]);

  const goMappingFilter = useCallback((overrides) => {
    try {
      const cur = JSON.parse(sessionStorage.getItem(MAPPING_FILTER_KEY)) ?? {};
      sessionStorage.setItem(MAPPING_FILTER_KEY, JSON.stringify({ ...cur, ...overrides }));
    } catch { /* ignore */ }
    router.push("/admin/marketplace/applications");
  }, [router]);

  if (!jobsReady || !mappingsReady) {
    return (
      <>
        <AdminTopBar title="Marketplace" description="ภาพรวม Marketplace" />
        <div className="flex items-center justify-center py-24 text-sm text-muted">กำลังโหลดข้อมูล...</div>
      </>
    );
  }

  // ── Job stats ─────────────────────────────────────────────────────────────
  const totalJobs  = jobs.length;
  const openJobs   = jobs.filter(j => j.status === "เปิดรับ").length;
  const closedJobs = jobs.filter(j => j.status === "ปิดรับ").length;
  const fullJobs   = jobs.filter(j => j.status === "เต็มแล้ว").length;

  const byJobStatus = Object.entries(
    jobs.reduce((acc, j) => ({ ...acc, [j.status]: (acc[j.status] || 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1]);

  const byType = Object.entries(
    jobs.reduce((acc, j) => ({ ...acc, [j.type]: (acc[j.type] || 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1]);

  const byField = Object.entries(
    jobs.reduce((acc, j) => {
      if (j.field) acc[j.field] = (acc[j.field] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  // ── Mapping stats ─────────────────────────────────────────────────────────
  const totalMappings   = mappings.length;
  const passedMappings  = mappings.filter(m => m.status === "ผ่านการคัดเลือก").length;
  const appliedMappings = mappings.filter(m => m.status === "สมัครแล้ว").length;
  const failedMappings  = mappings.filter(m => m.status === "ไม่ผ่านการคัดเลือก").length;
  const placementRate   = totalMappings > 0 ? Math.round((passedMappings / totalMappings) * 100) : 0;

  const byMapStatus = Object.entries(
    mappings.reduce((acc, m) => ({ ...acc, [m.status]: (acc[m.status] || 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1]);

  // ── Company stats ─────────────────────────────────────────────────────────
  const totalCompanies = companies.length;

  const byIndustry = Object.entries(
    companies.reduce((acc, c) => {
      const k = c.industry || "ไม่ระบุ";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const byCompanyType = Object.entries(
    companies.reduce((acc, c) => {
      const k = c.type || "ไม่ระบุ";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const byCompanyCountry = Object.entries(
    companies.reduce((acc, c) => {
      const k = c.country || "ไม่ระบุ";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  // บริษัทที่มีตำแหน่งงานอยู่
  const companiesWithJobs = new Set(jobs.map(j => j.companyId)).size;

  // ── Student mapping stats ─────────────────────────────────────────────────
  const mappedStudentIds = new Set(mappings.map(m => m.studentId));
  const mappedStudents   = students.filter(s => mappedStudentIds.has(s.id)).length;
  const unmappedStudents = students.length - mappedStudents;

  // ── Top jobs by applications ───────────────────────────────────────────────
  const topJobs = [...jobs]
    .filter(j => j.applications > 0)
    .sort((a, b) => (b.applications || 0) - (a.applications || 0))
    .slice(0, 5);

  // ── Recent mappings ────────────────────────────────────────────────────────
  const recentMappings = [...mappings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  return (
    <>
      <AdminTopBar
        title="Marketplace"
        description={`ภาพรวม — ตำแหน่งงาน ${totalJobs} ตำแหน่ง · บริษัท ${totalCompanies} แห่ง · Mapping ${totalMappings} รายการ`}
      />

      <div className="space-y-6 p-6">

        {/* ── 1. Stat Cards ── */}
        <div className="admin-stat-grid">
          <StatCard
            label="ตำแหน่งงานทั้งหมด"
            value={totalJobs.toLocaleString()}
            icon="💼"
            change={`เปิดรับ ${openJobs} · ปิดรับ ${closedJobs + fullJobs}`}
          />
          <StatCard
            label="บริษัทในระบบ"
            value={totalCompanies.toLocaleString()}
            icon="🏢"
            change={`${companiesWithJobs} บริษัทมีตำแหน่งงาน`}
          />
          <StatCard
            label="Mapping ทั้งหมด"
            value={totalMappings.toLocaleString()}
            icon="🔗"
            change={`ผ่านการคัดเลือก ${passedMappings} · รอผล ${appliedMappings}`}
          />
          <StatCard
            label="Placement Rate"
            value={`${placementRate}%`}
            icon="📈"
            change={`${passedMappings} / ${totalMappings} Mapping สำเร็จ`}
          />
        </div>

        {/* ── 2. Job status + Mapping status ── */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Job status */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">สถานะตำแหน่งงาน</h2>
              <button
                onClick={() => goJobFilter({ filterStatus: "ทั้งหมด" })}
                className="text-xs font-medium text-primary hover:underline"
              >
                ดูทั้งหมด →
              </button>
            </div>
            <div className="space-y-3">
              {byJobStatus.map(([status, count]) => (
                <BarRow
                  key={status}
                  label={status}
                  count={count}
                  total={totalJobs}
                  colorClass={JOB_STATUS_COLOR[status]?.bar ?? "bg-gray-400"}
                  badge={JOB_STATUS_COLOR[status]?.badge}
                  unit="ตำแหน่ง"
                />
              ))}
            </div>
            {/* Summary tiles */}
            <div className="mt-2 grid grid-cols-3 gap-2 pt-2 border-t border-border">
              {[
                { label: "เปิดรับ",  count: openJobs,   color: "text-emerald-600" },
                { label: "เต็มแล้ว", count: fullJobs,   color: "text-blue-600" },
                { label: "ปิดรับ",   count: closedJobs, color: "text-gray-500" },
              ].map(({ label, count, color }) => (
                <button
                  key={label}
                  onClick={() => goJobFilter({ filterStatus: label })}
                  className="text-center rounded-lg py-2 hover:bg-surface-muted transition-colors cursor-pointer"
                >
                  <div className={`text-xl font-extrabold ${color}`}>{count}</div>
                  <div className="text-[10px] text-muted leading-tight">{label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Mapping status */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">สถานะใบสมัคร (Mapping)</h2>
              <button
                onClick={() => goMappingFilter({ filterStatus: "ทั้งหมด" })}
                className="text-xs font-medium text-primary hover:underline"
              >
                ดูทั้งหมด →
              </button>
            </div>
            <div className="space-y-3">
              {byMapStatus.map(([status, count]) => (
                <BarRow
                  key={status}
                  label={status}
                  count={count}
                  total={totalMappings}
                  colorClass={MAP_STATUS_COLOR[status]?.bar ?? "bg-gray-400"}
                  badge={MAP_STATUS_COLOR[status]?.badge}
                />
              ))}
            </div>
            {/* Mapping summary */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
              {[
                { label: "สมัครแล้ว",       count: appliedMappings, color: "text-blue-600" },
                { label: "ผ่านการคัดเลือก", count: passedMappings,  color: "text-emerald-600" },
                { label: "ไม่ผ่าน",         count: failedMappings,  color: "text-red-500" },
              ].map(({ label, count, color }) => (
                <button
                  key={label}
                  onClick={() => goMappingFilter({ filterStatus: label === "ไม่ผ่าน" ? "ไม่ผ่านการคัดเลือก" : label })}
                  className="text-center rounded-lg py-2 hover:bg-surface-muted transition-colors cursor-pointer"
                >
                  <div className={`text-xl font-extrabold ${color}`}>{count}</div>
                  <div className="text-[10px] text-muted leading-tight">{label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── 3. Companies breakdown ── */}
        {totalCompanies > 0 && (
          <div className="grid gap-6 lg:grid-cols-3">

            {/* Industry breakdown */}
            <div className="card p-5 space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground">บริษัทแยกตามอุตสาหกรรม</h2>
                <span className="text-xs text-muted">{totalCompanies} บริษัท</span>
              </div>
              <div className="space-y-3">
                {byIndustry.map(([industry, count], i) => (
                  <BarRow
                    key={industry}
                    label={industry}
                    count={count}
                    total={totalCompanies}
                    colorClass={INDUSTRY_PALETTE[i % INDUSTRY_PALETTE.length].bar}
                    badge={INDUSTRY_PALETTE[i % INDUSTRY_PALETTE.length].badge}
                    unit="บริษัท"
                  />
                ))}
              </div>
            </div>

            {/* Company type + country */}
            <div className="space-y-4">
              {/* Company type */}
              <div className="card p-5 space-y-3">
                <h2 className="font-semibold text-foreground text-sm">ประเภทบริษัท</h2>
                <div className="space-y-3">
                  {byCompanyType.map(([type, count], i) => (
                    <BarRow
                      key={type}
                      label={type}
                      count={count}
                      total={totalCompanies}
                      colorClass={INDUSTRY_PALETTE[i % INDUSTRY_PALETTE.length].bar}
                      badge={INDUSTRY_PALETTE[i % INDUSTRY_PALETTE.length].badge}
                      unit="บริษัท"
                    />
                  ))}
                </div>
                {/* Summary tiles */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                  {byCompanyType.map(([type, count]) => (
                    <div key={type} className="rounded-xl bg-surface-muted px-3 py-2.5 text-center">
                      <p className="text-lg font-extrabold text-foreground">{count}</p>
                      <p className="text-xs text-muted truncate">{type}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Country breakdown */}
              <div className="card p-5 space-y-3">
                <h2 className="font-semibold text-foreground text-sm">ประเทศ</h2>
                <div className="space-y-3">
                  {byCompanyCountry.map(([country, count], i) => {
                    const colors = ["bg-primary", "bg-sky-500", "bg-violet-500", "bg-amber-500"];
                    const badges = ["bg-accent-soft text-primary", "bg-sky-100 text-sky-700", "bg-violet-100 text-violet-700", "bg-amber-100 text-amber-700"];
                    return (
                      <BarRow
                        key={country}
                        label={country}
                        count={count}
                        total={totalCompanies}
                        colorClass={colors[i % colors.length]}
                        badge={badges[i % badges.length]}
                        unit="บริษัท"
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 4. Job type + Field + Mini-stats ── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* ประเภทงาน + สาขาวิชา */}
          <div className="card p-5 space-y-4 lg:col-span-2">
            <div className="grid gap-5 sm:grid-cols-2">
              {/* ประเภทงาน */}
              <div className="space-y-3">
                <h2 className="font-semibold text-foreground">ประเภทตำแหน่งงาน</h2>
                <div className="space-y-3">
                  {byType.map(([type, count]) => (
                    <BarRow
                      key={type}
                      label={type}
                      count={count}
                      total={totalJobs}
                      colorClass={TYPE_COLOR[type]?.bar ?? "bg-gray-400"}
                      badge={TYPE_COLOR[type]?.badge}
                      unit="ตำแหน่ง"
                    />
                  ))}
                </div>
                {/* Type summary tiles — คลิกได้ filter */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                  {byType.map(([type, count]) => (
                    <button
                      key={type}
                      onClick={() => goJobFilter({ filterType: type })}
                      className="rounded-xl bg-surface-muted px-3 py-2.5 text-center hover:bg-accent-soft/50 transition-colors"
                    >
                      <p className="text-lg font-extrabold text-foreground">{count}</p>
                      <p className="text-xs text-muted">{type}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* สาขาวิชา */}
              <div className="space-y-3">
                <h2 className="font-semibold text-foreground">สาขาวิชา</h2>
                <div className="space-y-3">
                  {byField.slice(0, 6).map(([field, count], i) => (
                    <BarRow
                      key={field}
                      label={field}
                      count={count}
                      total={totalJobs}
                      colorClass={INDUSTRY_PALETTE[i % INDUSTRY_PALETTE.length].bar}
                      unit="ตำแหน่ง"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mapped bar */}
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-foreground text-sm">นักเรียนที่มี Mapping</h2>
            <div className="flex h-4 overflow-hidden rounded-full">
              <div
                className="bg-violet-500 transition-all duration-500"
                style={{ width: `${students.length > 0 ? Math.round(mappedStudents / students.length * 100) : 0}%` }}
              />
              <div className="flex-1 bg-surface-muted" />
            </div>
            <div className="space-y-1 text-xs text-muted">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-violet-500 shrink-0" />
                มี Mapping <span className="font-semibold text-foreground">{mappedStudents}</span> คน
                ({students.length > 0 ? Math.round(mappedStudents / students.length * 100) : 0}%)
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-surface-muted border border-border shrink-0" />
                ยังไม่มี <span className="font-semibold text-foreground">{unmappedStudents}</span> คน
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. Top jobs by applications ── */}
        {topJobs.length > 0 && (
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">🏆 ตำแหน่งงานที่มีผู้สมัครมากที่สุด</h2>
              <button
                onClick={() => goJobFilter({ sortBy: "apps_desc" })}
                className="text-xs font-medium text-primary hover:underline"
              >
                ดูทั้งหมด →
              </button>
            </div>
            <div className="space-y-2">
              {topJobs.map((j, i) => {
                const pct = j.slots > 0 ? Math.min(Math.round((j.applications / j.slots) * 100), 100) : 0;
                return (
                  <Link
                    key={j.id}
                    href={`/admin/marketplace/job-positions/${j.id}`}
                    className="flex items-center gap-4 rounded-xl border border-border px-4 py-3 hover:border-primary hover:bg-accent-soft/30 transition-colors"
                  >
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

        {/* ── 6. Recent mappings ── */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">🔗 Mapping ล่าสุด</h2>
            <button
              onClick={() => goMappingFilter({ sortBy: "newest" })}
              className="text-xs font-medium text-primary hover:underline"
            >
              ดูทั้งหมด ({totalMappings}) →
            </button>
          </div>
          {recentMappings.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {recentMappings.map((m) => {
                const s   = students.find(x => x.id === m.studentId);
                const j   = jobs.find(x => x.id === m.jobId);
                const cfg = MAP_STATUS_COLOR[m.status];
                return (
                  <Link
                    key={m.id}
                    href={`/admin/marketplace/applications/${m.id}`}
                    className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3 hover:border-primary hover:bg-accent-soft/30 transition-colors"
                  >
                    {/* นักเรียน + สถานะ */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-primary">
                          {(s?.name ?? m.studentId).charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {s ? `${s.prefix}${s.name} ${s.lastname}` : m.studentId}
                          </p>
                          <p className="font-mono text-[10px] text-muted">{m.id}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg?.badge ?? "bg-gray-100 text-gray-600"}`}>
                        {m.status}
                      </span>
                    </div>
                    {/* ตำแหน่งงาน */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] text-muted shrink-0">💼</span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">{j?.title ?? m.jobId}</p>
                        {j && <p className="truncate text-[10px] text-muted">{j.companyName}</p>}
                      </div>
                    </div>
                    {/* วันที่สมัคร */}
                    {m.appliedDate && (
                      <p className="text-[10px] text-muted">
                        สมัคร {new Date(m.appliedDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted">ยังไม่มีข้อมูล Mapping</p>
          )}
        </div>

        {/* ── 7. Quick links ── */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">จัดการ Marketplace</h2>
          <div className="grid gap-3 sm:grid-cols-3">
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
