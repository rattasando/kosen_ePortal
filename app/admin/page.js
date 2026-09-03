"use client";

import Link from "next/link";
import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import { useStudents } from "@/components/admin/contexts/StudentContext";
import { useCompanies } from "@/components/admin/contexts/CompanyContext";
import { useJobs } from "@/components/admin/contexts/JobContext";
import { useMappings } from "@/components/admin/contexts/MappingContext";
import { useNews } from "@/components/admin/contexts/NewsContext";
import { useActivities } from "@/components/admin/contexts/ActivitiesContext";

// ── Skeleton pill ─────────────────────────────────────────────────────────────
function Skel({ w = "w-10", h = "h-3.5" }) {
  return <span className={`inline-block ${w} ${h} animate-pulse rounded-full bg-surface-muted`} />;
}

// ── System card ────────────────────────────────────────────────────────────────
function SystemCard({ href, icon, title, titleTh, description, features, hover, iconBg, badge, badgeColor, stats, ready }) {
  return (
    <Link
      href={href}
      className={`card group flex flex-col gap-4 p-6 transition-all duration-200 ${hover}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted text-2xl transition-colors ${iconBg}`}>
            {icon}
          </span>
          <div>
            <p className="font-bold text-foreground group-hover:text-primary transition-colors">{title}</p>
            <p className="text-xs text-muted">{titleTh}</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeColor}`}>
          {ready ? badge : <Skel w="w-14" />}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-muted leading-relaxed">{description}</p>

      {/* Mini stats */}
      <div className="flex flex-wrap gap-2">
        {stats.map((s) => (
          <span key={s.label} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${s.color}`}>
            {ready
              ? <span className="text-sm font-extrabold">{s.value}</span>
              : <Skel w="w-5" h="h-4" />}
            {s.label}
          </span>
        ))}
      </div>

      {/* Feature tags */}
      <div className="flex flex-wrap gap-2">
        {features.map((f) => (
          <span key={f} className="rounded-lg bg-surface-muted px-2.5 py-1 text-xs font-medium text-foreground">{f}</span>
        ))}
      </div>
    </Link>
  );
}

export default function AdminHomePage() {
  const { students, ready: srReady }    = useStudents();
  const { companies, ready: coReady }   = useCompanies();
  const { jobs, ready: jbReady }        = useJobs();
  const { mappings, ready: mpReady }    = useMappings();
  const { news, ready: nwReady }        = useNews();
  const { activities, ready: acReady }  = useActivities();

  // ── Student stats ──────────────────────────────────────────────────────────
  const studyingStudents  = students.filter((s) => s.status === "กำลังศึกษา").length;
  const internStudents    = students.filter((s) => s.status === "ฝึกงาน").length;
  const graduatedStudents = students.filter((s) => s.status === "จบการศึกษา").length;

  // ── Company stats ──────────────────────────────────────────────────────────
  const totalCompanies   = companies.length;
  const activeCompanies  = companies.filter((c) => c.status === "ร่วมมือ").length;
  const pendingCompanies = companies.filter((c) => c.status === "รอดำเนินการ").length;

  // ── Job stats ──────────────────────────────────────────────────────────────
  const totalJobs  = jobs.length;
  const openJobs   = jobs.filter((j) => j.status === "เปิดรับ").length;
  const totalSlots = jobs.reduce((s, j) => s + (Number(j.slots) || 0), 0);

  // ── Mapping stats ──────────────────────────────────────────────────────────
  const totalMappings  = mappings.length;
  const activeMappings = mappings.filter((m) => ["สัมภาษณ์", "อนุมัติ", "ฝึกงาน"].includes(m.status)).length;

  // ── Information stats ──────────────────────────────────────────────────────
  const publishedNews       = news.filter((n) => n.status === "published").length;
  const publishedActivities = activities.filter((a) => a.status === "published").length;

  const systems = [
    {
      href:        "/admin/students",
      icon:        "🎓",
      title:       "Student Management",
      titleTh:     "ระบบจัดการนักเรียน",
      description: "บริหารจัดการข้อมูลนักเรียนทั้งหมด ตั้งแต่โปรไฟล์ สถาบันการศึกษา ไปจนถึงข้อมูลศิษย์เก่า พร้อมประวัติการแก้ไขทุก session",
      features:    ["รายชื่อ + โปรไฟล์นักเรียน", "เพิ่ม / แก้ไข / ลบ", "ข้อมูลศิษย์เก่า", "ประวัติการแก้ไข", "นำเข้า / ส่งออก CSV"],
      hover:       "card-glow-blue hover:bg-blue-50",
      iconBg:      "group-hover:bg-blue-100",
      ready:       srReady,
      badge:       internStudents > 0 ? `${internStudents} กำลังฝึกงาน` : `${studyingStudents} กำลังศึกษา`,
      badgeColor:  internStudents > 0 ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-primary",
      stats: [
        { label: "กำลังศึกษา", value: studyingStudents,  color: "text-blue-700 bg-blue-100" },
        { label: "ฝึกงาน",     value: internStudents,    color: "text-emerald-700 bg-emerald-100" },
        { label: "จบแล้ว",     value: graduatedStudents, color: "text-slate-600 bg-slate-100" },
      ],
    },
    {
      href:        "/admin/marketplace",
      icon:        "💼",
      title:       "Marketplace",
      titleTh:     "ระบบตลาดงาน",
      description: "จัดการตำแหน่งฝึกงาน รับสมัครและจับคู่นักเรียนกับบริษัทพาร์ทเนอร์ ติดตามสถานะใบสมัครตั้งแต่ยื่นจนถึงเริ่มฝึกงาน",
      features:    ["ตำแหน่งฝึกงาน (Job Positions)", "ใบสมัคร + จับคู่นักเรียน", "ติดตามสถานะใบสมัคร", "นำเข้า / ส่งออก CSV"],
      hover:       "card-glow-emerald hover:bg-emerald-50",
      iconBg:      "group-hover:bg-emerald-100",
      ready:       jbReady && mpReady,
      badge:       activeMappings > 0 ? `${activeMappings} กำลังดำเนินการ` : `${openJobs} ตำแหน่งเปิด`,
      badgeColor:  activeMappings > 0 ? "bg-blue-50 text-primary" : "bg-emerald-50 text-emerald-700",
      stats: [
        { label: "ตำแหน่งงานทั้งหมด", value: totalJobs,     color: "text-emerald-700 bg-emerald-100" },
        { label: "ที่นั่งทั้งหมด",      value: totalSlots,   color: "text-violet-700 bg-violet-100" },
        { label: "การสมัครรวม",         value: totalMappings, color: "text-blue-700 bg-blue-100" },
      ],
    },
    {
      href:        "/admin/companies",
      icon:        "🏢",
      title:       "Company Management",
      titleTh:     "ระบบจัดการบริษัท",
      description: "บริหารข้อมูลบริษัทพาร์ทเนอร์ทั้งหมด ครอบคลุมผู้ประสานงาน สถานะ MOU ตำแหน่งเปิดรับ และอุตสาหกรรม",
      features:    ["ข้อมูล + รายละเอียดบริษัท", "เพิ่ม / แก้ไข / ลบ", "สถานะ MOU + วันหมดอายุ", "ผู้ประสานงาน + ช่องทางติดต่อ", "นำเข้า / ส่งออก CSV"],
      hover:       "card-glow-violet hover:bg-violet-50",
      iconBg:      "group-hover:bg-violet-100",
      ready:       coReady,
      badge:       `${activeCompanies} ร่วมมืออยู่`,
      badgeColor:  "bg-emerald-50 text-emerald-700",
      stats: [
        { label: "ร่วมมืออยู่",   value: activeCompanies,  color: "text-emerald-700 bg-emerald-100" },
        { label: "รอดำเนินการ",   value: pendingCompanies, color: "text-amber-700 bg-amber-100" },
        { label: "ทั้งหมด",       value: totalCompanies,   color: "text-violet-700 bg-violet-100" },
      ],
    },
    {
      href:        "/admin/information/news",
      icon:        "📋",
      title:       "Information Management",
      titleTh:     "ระบบจัดการข้อมูลสถาบัน",
      description: "ดูแลเนื้อหาทั้งหมดของเว็บไซต์ ตั้งแต่ข่าวสาร กิจกรรม แบนเนอร์หน้าหลัก Splash Screen ไปจนถึง FAQ และเอกสารดาวน์โหลด",
      features:    ["ข่าวสาร + กิจกรรม", "แบนเนอร์ + Splash Screen", "FAQ + เอกสารดาวน์โหลด", "ข้อมูลติดต่อสถาบัน"],
      hover:       "card-glow-amber hover:bg-amber-50",
      iconBg:      "group-hover:bg-amber-100",
      ready:       nwReady && acReady,
      badge:       `${publishedNews + publishedActivities} เผยแพร่แล้ว`,
      badgeColor:  "bg-emerald-50 text-emerald-700",
      stats: [
        { label: "ข่าวสาร",  value: news.length,       color: "text-amber-700 bg-amber-100" },
        { label: "กิจกรรม",  value: activities.length, color: "text-orange-700 bg-orange-100" },
        { label: "เผยแพร่",  value: publishedNews + publishedActivities, color: "text-emerald-700 bg-emerald-100" },
      ],
    },
  ];

  return (
    <>
      <AdminTopBar title="Main Menu" />

      <div className="p-6">
        {/* ── System cards ── */}
        <div className="grid gap-6 md:grid-cols-2">
          {systems.map((sys) => (
            <SystemCard key={sys.href} {...sys} />
          ))}
        </div>
      </div>
    </>
  );
}
