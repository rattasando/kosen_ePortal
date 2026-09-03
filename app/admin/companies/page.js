"use client";

import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import StatCard from "@/components/admin/ui/StatCard";
import Link from "next/link";
import { useCompanies } from "@/components/admin/contexts/CompanyContext";

const STATUS_COLOR = {
  ร่วมมือ:     { bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
  รอดำเนินการ: { bar: "bg-amber-400",   badge: "bg-amber-100 text-amber-700" },
  ระงับ:       { bar: "bg-red-500",     badge: "bg-red-100 text-red-700" },
};

const IND_PALETTE = [
  { bar: "bg-primary",     badge: "bg-accent-soft text-primary" },
  { bar: "bg-sky-500",     badge: "bg-sky-100 text-sky-700" },
  { bar: "bg-violet-500",  badge: "bg-violet-100 text-violet-700" },
  { bar: "bg-amber-500",   badge: "bg-amber-100 text-amber-700" },
  { bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
  { bar: "bg-rose-500",    badge: "bg-rose-100 text-rose-700" },
  { bar: "bg-cyan-500",    badge: "bg-cyan-100 text-cyan-700" },
  { bar: "bg-orange-500",  badge: "bg-orange-100 text-orange-700" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function BarRow({ label, count, total, colorClass, badge, unit = "บริษัท", subLabel }) {
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

function MiniStat({ label, value, sub, color }) {
  return (
    <div className={`rounded-xl border-l-4 ${color} bg-surface px-4 py-3`}>
      <p className="text-2xl font-extrabold text-foreground">{value}</p>
      <p className="text-xs font-semibold text-foreground">{label}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CompaniesDashboardPage() {
  const { companies, ready } = useCompanies();

  if (!ready) {
    return (
      <>
        <AdminTopBar title="Company Management" description="ภาพรวมบริษัทพาร์ทเนอร์" />
        <div className="flex items-center justify-center py-24 text-muted text-sm">กำลังโหลดข้อมูล...</div>
      </>
    );
  }

  const total = companies.length;

  // ── Status breakdown ───────────────────────────────────────────────────────
  const byStatus = Object.entries(
    companies.reduce((acc, c) => ({ ...acc, [c.status]: (acc[c.status] || 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1]);

  // ── Industry breakdown ─────────────────────────────────────────────────────
  const byIndustry = Object.entries(
    companies.reduce((acc, c) => {
      const k = c.industry || "ไม่ระบุ";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  // ── Key counts ─────────────────────────────────────────────────────────────
  const active    = companies.filter((c) => c.status === "ร่วมมือ").length;
  const pending   = companies.filter((c) => c.status === "รอดำเนินการ").length;
  const suspended = companies.filter((c) => c.status === "ระงับ").length;
  const withMOU   = companies.filter((c) => c.mouStatus === "มี MOU").length;
  const totalPos  = companies.reduce((s, c) => s + (c.openPositions || 0), 0);

  // ── Expiring MOU (within 6 months) ────────────────────────────────────────
  const today = new Date();
  const sixMonths = new Date(today);
  sixMonths.setMonth(sixMonths.getMonth() + 6);
  const expiringMOU = companies.filter((c) => {
    if (!c.mouExpiry) return false;
    const d = new Date(c.mouExpiry);
    return d >= today && d <= sixMonths;
  });

  // ── Top by open positions ──────────────────────────────────────────────────
  const topByPositions = [...companies]
    .filter((c) => c.openPositions > 0)
    .sort((a, b) => b.openPositions - a.openPositions)
    .slice(0, 5);

  // ── Recently added (createdAt desc) ───────────────────────────────────────
  const recentCompanies = [...companies]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  return (
    <>
      <AdminTopBar
        title="Company Management"
        description={`ภาพรวมบริษัทพาร์ทเนอร์ทั้งหมด ${total} บริษัท — อัปเดตจากข้อมูลจริงในระบบ`}
      />

      <div className="space-y-6 p-6">

        {/* ── 1. Stat Cards ── */}
        <div className="admin-stat-grid">
          <StatCard label="บริษัททั้งหมด"     value={total}    change="ในระบบทั้งหมด"                                                       icon="🏢" />
          <StatCard label="ร่วมมืออยู่"        value={active}   change={total > 0 ? `${Math.round(active/total*100)}% ของทั้งหมด` : "—"}   icon="🤝" />
          <StatCard label="มี MOU"             value={withMOU}  change={total > 0 ? `${Math.round(withMOU/total*100)}% มีสัญญา` : "—"}       icon="📋" />
          <StatCard label="ตำแหน่งเปิดรับรวม" value={totalPos}  change="จากบริษัทที่ร่วมมือ"                                               icon="💼" />
        </div>

        {/* ── 2. Status + Industry ── */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Status */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">สถานะความร่วมมือ</h2>
              <span className="text-xs text-muted">{total} บริษัท</span>
            </div>
            <div className="space-y-3">
              {byStatus.map(([status, count]) => (
                <BarRow key={status} label={status} count={count} total={total}
                  colorClass={STATUS_COLOR[status]?.bar ?? "bg-gray-400"}
                  badge={STATUS_COLOR[status]?.badge} />
              ))}
            </div>
            {/* Summary tiles */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
              {byStatus.map(([status, count]) => (
                <div key={status} className="text-center">
                  <p className="text-lg font-extrabold text-foreground">{count}</p>
                  <p className="text-xs text-muted">{status}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Industry */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">อุตสาหกรรม</h2>
              <span className="text-xs text-muted">{byIndustry.length} ประเภท</span>
            </div>
            <div className="space-y-3">
              {byIndustry.map(([ind, count], i) => (
                <BarRow key={ind} label={ind} count={count} total={total}
                  colorClass={IND_PALETTE[i % IND_PALETTE.length].bar}
                  badge={IND_PALETTE[i % IND_PALETTE.length].badge} />
              ))}
            </div>
          </div>
        </div>

        {/* ── 3. Mini stats + MOU expiring ── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Mini stats */}
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-foreground text-sm">สรุปสถานะ</h2>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="ร่วมมืออยู่"  value={active}    sub="บริษัท" color="border-emerald-500" />
              <MiniStat label="รอดำเนินการ"  value={pending}   sub="บริษัท" color="border-amber-400" />
              <MiniStat label="ระงับ"         value={suspended} sub="บริษัท" color="border-red-500" />
              <MiniStat label="มี MOU"        value={withMOU}   sub="สัญญา"  color="border-blue-500" />
            </div>
          </div>

          {/* MOU ใกล้หมดอายุ */}
          <div className="card p-5 space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">⚠️ MOU ใกล้หมดอายุ (6 เดือน)</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${expiringMOU.length > 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                {expiringMOU.length} สัญญา
              </span>
            </div>
            {expiringMOU.length === 0 ? (
              <p className="text-sm text-muted">ไม่มี MOU ที่ใกล้หมดอายุในขณะนี้</p>
            ) : (
              <div className="space-y-2">
                {expiringMOU.map((c) => (
                  <Link key={c.id} href={`/admin/companies/${c.id}`}
                    className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 hover:border-amber-400 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-foreground line-clamp-1">{c.name}</p>
                      <p className="text-xs text-muted">{c.industry}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs font-bold text-amber-600">หมดอายุ {c.mouExpiry}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 4. Top open positions ── */}
        {topByPositions.length > 0 && (
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">💼 บริษัทที่เปิดรับฝึกงานมากที่สุด</h2>
              <Link href="/admin/companies/list" className="text-xs font-medium text-primary hover:underline">ดูทั้งหมด →</Link>
            </div>
            <div className="space-y-2">
              {topByPositions.map((c, i) => {
                const maxPos = topByPositions[0].openPositions;
                const pct = Math.round((c.openPositions / maxPos) * 100);
                return (
                  <Link key={c.id} href={`/admin/companies/${c.id}`}
                    className="flex items-center gap-3 rounded-xl border border-border px-4 py-2.5 hover:border-primary hover:bg-accent-soft/30 transition-colors">
                    <span className="w-5 shrink-0 text-xs font-bold text-muted text-center">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                        <span className="text-sm font-bold text-primary ml-2 shrink-0">{c.openPositions} คน</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                        <div className="h-1.5 rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLOR[c.status]?.badge ?? "bg-gray-100 text-gray-600"}`}>
                      {c.status}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 5. Recent companies (card grid) ── */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">🏢 บริษัทล่าสุดในระบบ</h2>
            <Link href="/admin/companies/list" className="text-xs font-medium text-primary hover:underline">
              ดูทั้งหมด ({total}) →
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recentCompanies.map((c) => (
              <Link
                key={c.id}
                href={`/admin/companies/${c.id}`}
                className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3 hover:border-primary hover:bg-accent-soft/30 transition-colors"
              >
                {/* ชื่อ + สถานะ */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-600">
                      {c.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                      <p className="font-mono text-[10px] text-muted">{c.id}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLOR[c.status]?.badge ?? "bg-gray-100 text-gray-600"}`}>
                    {c.status}
                  </span>
                </div>
                {/* อุตสาหกรรม + จังหวัด */}
                {(c.industry || c.province) && (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] text-muted shrink-0">🏭</span>
                    <p className="truncate text-xs text-muted">
                      {[c.industry, c.province].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                )}
                {/* MOU + ตำแหน่งเปิด */}
                <div className="flex items-center gap-2">
                  {c.mouStatus === "มี MOU" && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">มี MOU</span>
                  )}
                  {c.openPositions > 0 && (
                    <span className="text-[10px] font-medium text-primary">เปิดรับ {c.openPositions} คน</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── 6. Quick links ── */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">จัดการบริษัท</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/admin/companies/list", label: "รายชื่อบริษัท",  icon: "🏢", desc: "ค้นหาและจัดการข้อมูลบริษัท" },
              { href: "/admin/companies/new",  label: "เพิ่มบริษัท",    icon: "➕", desc: "ลงทะเบียนบริษัทพาร์ทเนอร์ใหม่" },
              { href: "/admin/marketplace",    label: "Marketplace",    icon: "💼", desc: "ตำแหน่งงานและการสมัคร" },
              { href: "/admin/marketplace/applications", label: "ใบสมัคร", icon: "🔗", desc: "จัดการการจับคู่นักเรียน-งาน" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="card flex flex-col gap-2 p-4 transition-shadow hover:shadow-md">
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
