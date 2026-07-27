import Link from "next/link";
import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import { DEFAULT_STUDENTS } from "@/lib/data/studentData";
import { DEFAULT_COMPANIES } from "@/lib/data/companyData";
import { DEFAULT_JOBS } from "@/lib/data/jobData";
import { NEWS, ACTIVITIES } from "@/lib/config/publicData";

const totalStudents    = DEFAULT_STUDENTS.length;
const studyingStudents = DEFAULT_STUDENTS.filter((s) => s.status === "กำลังศึกษา").length;
const internStudents   = DEFAULT_STUDENTS.filter((s) => s.status === "ฝึกงาน").length;
const graduatedStudents = DEFAULT_STUDENTS.filter((s) => s.status === "จบการศึกษา").length;

const totalCompanies  = DEFAULT_COMPANIES.length;
const activeCompanies = DEFAULT_COMPANIES.filter((c) => c.status === "ร่วมมือ").length;

const totalJobs      = DEFAULT_JOBS.length;
const openJobs       = DEFAULT_JOBS.filter((j) => j.status === "เปิดรับ").length;
const totalSlots     = DEFAULT_JOBS.reduce((s, j) => s + (Number(j.slots) || 0), 0);
const totalApps      = DEFAULT_JOBS.reduce((s, j) => s + (Number(j.applications) || 0), 0);

const systems = [
  {
    href: "/admin/students",
    icon: "🎓",
    title: "Student Management",
    titleTh: "ระบบจัดการนักเรียน",
    description:
      "บริหารจัดการข้อมูลนักเรียนทั้งหมด ตั้งแต่การลงทะเบียน สถานะการศึกษา เอกสาร ไปจนถึงการจัดการทุนการศึกษา",
    features: [
      "ข้อมูลนักเรียน",
      "เพิ่ม / แก้ไข / ลบ",
      "ทุนการศึกษา",
      "จัดการเอกสาร",
    ],
    hover: "card-glow-blue hover:bg-blue-50",
    iconBg: "group-hover:bg-blue-100",
    badge: `${totalStudents} คน`,
    badgeColor: "bg-blue-50 text-primary",
    stats: [
      {
        label: "กำลังศึกษา",
        value: studyingStudents,
        color: "text-blue-700 bg-blue-100",
      },
      {
        label: "ฝึกงาน",
        value: internStudents,
        color: "text-emerald-700 bg-emerald-100",
      },
      {
        label: "จบแล้ว",
        value: graduatedStudents,
        color: "text-slate-600 bg-slate-100",
      },
    ],
  },
  {
    href: "/admin/marketplace",
    icon: "💼",
    title: "Marketplace",
    titleTh: "ระบบตลาดงาน",
    description:
      "จัดการตำแหน่งงานและการฝึกงาน เชื่อมต่อนักเรียนกับบริษัทพาร์ทเนอร์ ติดตามสถานะการสมัครงาน",
    features: [
      "ตำแหน่งงานว่าง",
      "จับคู่นักเรียน-งาน",
      "ติดตามสถานะ",
      "รายงานสรุป",
    ],
    hover: "card-glow-emerald hover:bg-emerald-50",
    iconBg: "group-hover:bg-emerald-100",
    badge: `${openJobs} ตำแหน่งเปิด`,
    badgeColor: "bg-emerald-50 text-emerald-700",
    stats: [
      {
        label: "ตำแหน่งงานทั้งหมด",
        value: totalJobs,
        color: "text-emerald-700 bg-emerald-100",
      },
      {
        label: "ผู้สมัครรวม",
        value: totalApps,
        color: "text-blue-700 bg-blue-100",
      },
      {
        label: "ที่นั่งทั้งหมด",
        value: totalSlots,
        color: "text-violet-700 bg-violet-100",
      },
    ],
  },
  {
    href: "/admin/companies",
    icon: "🏢",
    title: "Company Management",
    titleTh: "ระบบจัดการบริษัท",
    description:
      "บริหารข้อมูลบริษัทพาร์ทเนอร์ทั้งหมด จัดการความสัมพันธ์ และติดตามประวัติความร่วมมือ",
    features: [
      "ข้อมูลบริษัท",
      "เพิ่ม / แก้ไข",
      "ประวัติความร่วมมือ",
      "ติดต่อประสานงาน",
    ],
    hover: "card-glow-violet hover:bg-violet-50",
    iconBg: "group-hover:bg-violet-100",
    badge: `${totalCompanies} บริษัท`,
    badgeColor: "bg-violet-50 text-violet-700",
    stats: [
      {
        label: "ทั้งหมด",
        value: totalCompanies,
        color: "text-violet-700 bg-violet-100",
      },
      {
        label: "ร่วมมืออยู่",
        value: activeCompanies,
        color: "text-emerald-700 bg-emerald-100",
      },
      {
        label: "รอดำเนินการ",
        value: DEFAULT_COMPANIES.filter((c) => c.status === "รอดำเนินการ").length,
        color: "text-amber-700 bg-amber-100",
      },
    ],
  },
  {
    href: "/admin/information/news",
    icon: "📋",
    title: "Information Management",
    titleTh: "ระบบจัดการข้อมูลสถาบัน",
    description:
      "ดูแลเนื้อหาเว็บไซต์ ประกาศข่าวสาร กิจกรรม แบนเนอร์ คำถามที่พบบ่อย และข้อมูลติดต่อ",
    features: [
      "ข่าวสารและกิจกรรม",
      "แบนเนอร์สไลด์",
      "คำถามที่พบบ่อย",
      "ข้อมูลติดต่อ",
    ],
    hover: "card-glow-amber hover:bg-amber-50",
    iconBg: "group-hover:bg-amber-100",
    badge: "5 หมวดหมู่",
    badgeColor: "bg-amber-50 text-amber-700",
    stats: [
      {
        label: "ข่าวสาร",
        value: NEWS.length,
        color: "text-amber-700 bg-amber-100",
      },
      {
        label: "กิจกรรม",
        value: ACTIVITIES.length,
        color: "text-orange-700 bg-orange-100",
      },
    ],
  },
];

export default function AdminHomePage() {
  return (
    <>
      <AdminTopBar
        title="Main Menu"
        description="เลือกระบบที่ต้องการจัดการ"
      />

      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          {systems.map((sys) => (
            <Link
              key={sys.href}
              href={sys.href}
              className={`card group flex flex-col gap-4 p-6 transition-all duration-200 ${sys.hover}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted text-2xl transition-colors ${sys.iconBg}`}
                  >
                    {sys.icon}
                  </span>
                  <div>
                    <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                      {sys.title}
                    </p>
                    <p className="text-xs text-muted">{sys.titleTh}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${sys.badgeColor}`}
                >
                  {sys.badge}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-muted leading-relaxed">
                {sys.description}
              </p>

              {/* Mini stats */}
              <div className="flex flex-wrap gap-2">
                {sys.stats.map((s) => (
                  <span
                    key={s.label}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${s.color}`}
                  >
                    <span className="text-sm font-extrabold">{s.value}</span>
                    {s.label}
                  </span>
                ))}
              </div>

              {/* Feature tags */}
              <div className="flex flex-wrap gap-2">
                {sys.features.map((f) => (
                  <span
                    key={f}
                    className="rounded-lg bg-surface-muted px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
