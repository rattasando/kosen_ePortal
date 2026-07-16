import Link from "next/link";
import HeroSection from "@/components/HeroSection";

const SCHOLARSHIP_TYPES = [
  {
    id: "2yr",
    name: "ทุน 2 ปี",
    badge: "bg-sky-100 text-sky-700 border-sky-200",
    highlight: "border-sky-200",
    icon: "🎓",
    coverage: "2 ปีสุดท้าย (ปี 4–5)",
    value: "ภาคการศึกษาละ 25,000 บาท",
    total: "รวมสูงสุด 100,000 บาท",
    criteria: [
      "เกรดเฉลี่ยสะสม 3.00 ขึ้นไป",
      "ไม่เคยมีประวัติทางวินัย",
      "ผ่านการสัมภาษณ์คณะกรรมการ",
    ],
    benefits: ["ค่าเล่าเรียน", "ค่าหนังสือและอุปกรณ์", "ค่าใช้จ่ายในการฝึกงาน"],
    count: 120,
  },
  {
    id: "3yr",
    name: "ทุน 3 ปี",
    badge: "bg-teal-100 text-teal-700 border-teal-200",
    highlight: "border-teal-200",
    icon: "🏅",
    coverage: "3 ปีสุดท้าย (ปี 3–5)",
    value: "ภาคการศึกษาละ 30,000 บาท",
    total: "รวมสูงสุด 180,000 บาท",
    criteria: [
      "เกรดเฉลี่ยสะสม 3.25 ขึ้นไป",
      "ผลงานโปรเจกต์หรือการแข่งขันโดดเด่น",
      "ผ่านการสัมภาษณ์คณะกรรมการ",
    ],
    benefits: [
      "ค่าเล่าเรียน",
      "ค่าที่พัก (บางส่วน)",
      "ค่าหนังสือและอุปกรณ์",
      "ค่าเดินทางฝึกงาน",
    ],
    count: 80,
  },
  {
    id: "5yr",
    name: "ทุน 5 ปี",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    highlight: "border-emerald-300",
    icon: "🏆",
    coverage: "ตลอดหลักสูตร 5 ปี",
    value: "ภาคการศึกษาละ 40,000 บาท",
    total: "รวมสูงสุด 400,000 บาท",
    criteria: [
      "เกรดเฉลี่ยสะสม 3.50 ขึ้นไป",
      "ผลการสอบแข่งขันระดับชาติหรือนานาชาติ",
      "คะแนนสอบทุนสูงสุด 5% แรก",
      "ผ่านการสัมภาษณ์ผู้บริหารสถาบัน",
    ],
    benefits: [
      "ค่าเล่าเรียนเต็มจำนวน",
      "ค่าที่พักในหอพัก",
      "ค่าหนังสือและอุปกรณ์",
      "โอกาสแลกเปลี่ยนที่ญี่ปุ่น (ปี 3)",
      "ค่าใช้จ่ายส่วนตัวรายเดือน",
    ],
    count: 50,
    featured: true,
  },
  {
    id: "jph",
    name: "ทุน จภ.",
    badge: "bg-violet-100 text-violet-700 border-violet-200",
    highlight: "border-violet-200",
    icon: "🌐",
    coverage: "ตามระยะเวลาที่กำหนด",
    value: "ตามเงื่อนไขผู้ให้ทุน",
    total: "แตกต่างกันตามบริษัท",
    criteria: [
      "ผ่านเกณฑ์การคัดเลือกของบริษัท",
      "เกรดเฉลี่ยสะสม 2.75 ขึ้นไป",
      "สัมภาษณ์กับทีม HR ของบริษัทพาร์ทเนอร์",
    ],
    benefits: [
      "ค่าเล่าเรียน (บางส่วนหรือเต็มจำนวน)",
      "ค่าใช้จ่ายระหว่างฝึกงาน",
      "โอกาสบรรจุงานหลังเรียนจบ",
      "เงินเดือนระหว่างฝึกงาน",
    ],
    count: 100,
    note: "บริษัทพาร์ทเนอร์ 25+ แห่ง",
  },
];

const PROCESS_STEPS = [
  {
    step: "01",
    title: "ตรวจสอบคุณสมบัติ",
    desc: "ตรวจสอบเกณฑ์คุณสมบัติของทุนแต่ละประเภทที่สนใจ และเลือกประเภทที่เหมาะสมกับตัวเอง",
    icon: "📋",
  },
  {
    step: "02",
    title: "เตรียมเอกสาร",
    desc: "ใบสมัคร ทรานสคริปต์ หนังสือรับรองจากอาจารย์ หลักฐานผลงาน และเอกสารทางการเงิน (ถ้ามี)",
    icon: "📁",
  },
  {
    step: "03",
    title: "ยื่นสมัครออนไลน์",
    desc: "สมัครผ่าน KOSEN Portal ได้ตั้งแต่วันที่ 1 มิถุนายน – 31 กรกฎาคม ของทุกปีการศึกษา",
    icon: "💻",
  },
  {
    step: "04",
    title: "สอบข้อเขียนและสัมภาษณ์",
    desc: "ผู้สมัครที่ผ่านรอบเอกสารจะได้รับการนัดสอบข้อเขียนและสัมภาษณ์กับคณะกรรมการ",
    icon: "🗣️",
  },
  {
    step: "05",
    title: "ประกาศผล",
    desc: "ประกาศผลการคัดเลือกภายใน 31 สิงหาคม ผ่านระบบ KOSEN Portal และอีเมลที่ลงทะเบียนไว้",
    icon: "📢",
  },
];

const FAQS = [
  {
    q: "สามารถสมัครทุนหลายประเภทพร้อมกันได้ไหม?",
    a: "ได้ แต่จะได้รับทุนได้เพียงประเภทเดียวเท่านั้น คณะกรรมการจะพิจารณาให้ทุนที่เหมาะสมที่สุดตามคุณสมบัติ",
  },
  {
    q: "หากเกรดตกต่ำกว่าเกณฑ์ จะสูญเสียทุนทันทีไหม?",
    a: "มีระบบ probation 1 ภาคการศึกษา หากเกรดยังไม่ฟื้นตัวภายในระยะเวลาที่กำหนด ทุนจะถูกระงับชั่วคราวและทบทวนอีกครั้ง",
  },
  {
    q: "ทุน จภ. ต่างจากทุนอื่นอย่างไร?",
    a: "ทุน จภ. (จากภาคเอกชน) มาจากบริษัทพาร์ทเนอร์โดยตรง เงื่อนไขและมูลค่าขึ้นอยู่กับแต่ละบริษัท มักมีข้อผูกมัดเรื่องการฝึกงานหรือการทำงานหลังเรียนจบ",
  },
  {
    q: "นักศึกษาต่างชาติสมัครได้ไหม?",
    a: "ทุนบางประเภทเปิดรับนักศึกษาต่างชาติที่ศึกษาอยู่ในโครงการ Thai-KOSEN กรุณาติดต่อฝ่ายวิชาการเพื่อตรวจสอบเงื่อนไขเฉพาะ",
  },
];

export default function ScholarshipPage() {
  const totalScholarships = SCHOLARSHIP_TYPES.reduce((s, t) => s + t.count, 0);

  return (
    <div className="pb-20">
      {/* Hero */}
      <HeroSection className="bg-gradient-to-br from-[#4c1d95] via-[#5b21b6] to-[#4c1d95] py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(196,181,253,0.20),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,0,0,0.28),transparent_60%)]" />
        <div className="page-container relative">
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/60">
            <span className="h-px w-6 bg-white/30" />
            ทุนการศึกษา Thai-KOSEN
          </p>
          <h1 className="mt-1 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            ทุนการศึกษากว่า{" "}
            <span className="text-violet-200">{totalScholarships} ทุน</span>
            <br />
            อนาคตของคุณเริ่มต้นที่นี่
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/70">
            ค้นพบทุนการศึกษาที่เหมาะกับคุณ ตั้งแต่ทุน Merit-based
            ทุนขาดแคลนทุนทรัพย์ ไปจนถึงทุนจากบริษัทพาร์ทเนอร์ชั้นนำกว่า 25 แห่ง
          </p>

          {/* Stat chips */}
          <div className="mt-8 flex flex-wrap gap-3">
            {SCHOLARSHIP_TYPES.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm"
              >
                <span className="text-sm font-bold text-white">
                  {t.count} ทุน
                </span>
                <span className="ml-2 text-xs text-white/60">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </HeroSection>

      {/* Scholarship cards */}
      <div className="page-container py-16">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            ประเภทของทุน
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
            เลือกทุนที่เหมาะกับคุณ
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {SCHOLARSHIP_TYPES.map((t) => (
            <div
              key={t.id}
              className={`card overflow-hidden border-t-4 ${t.highlight} relative`}
            >
              {t.featured && (
                <div className="absolute right-4 top-4 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  แนะนำ
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-2xl">
                    {t.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${t.badge}`}
                      >
                        {t.name}
                      </span>
                      <span className="text-xs text-muted">{t.count} ทุน</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      ครอบคลุม: {t.coverage}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-surface-muted p-3">
                  <p className="text-sm font-bold text-foreground">{t.value}</p>
                  <p className="text-xs text-muted">{t.total}</p>
                  {t.note && (
                    <p className="mt-1 text-xs text-primary font-medium">
                      {t.note}
                    </p>
                  )}
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                      คุณสมบัติ
                    </p>
                    <ul className="space-y-1">
                      {t.criteria.map((c) => (
                        <li
                          key={c}
                          className="flex items-start gap-1.5 text-xs text-foreground"
                        >
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                      สิทธิประโยชน์
                    </p>
                    <ul className="space-y-1">
                      {t.benefits.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-1.5 text-xs text-foreground"
                        >
                          <span className="mt-0.5 text-emerald-500">✓</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Application process */}
      <div className="border-y border-violet-100 bg-violet-50 py-16">
        <div className="page-container">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              ขั้นตอนการสมัคร
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
              วิธีสมัครทุน
            </h2>
          </div>

          <div className="mx-auto max-w-2xl space-y-4">
            {PROCESS_STEPS.map((step, i) => (
              <div key={i} className="card flex gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl">
                  {step.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">
                      {step.step}
                    </span>
                    <h3 className="font-bold text-foreground">{step.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/contact" className="btn-primary">
              ติดต่อสอบถามเพิ่มเติม
            </Link>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="page-container py-16">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            คำถามที่พบบ่อย
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
            FAQ
          </h2>
        </div>
        <div className="mx-auto max-w-2xl space-y-4">
          {FAQS.map((faq, i) => (
            <div key={i} className="card p-5">
              <p className="font-bold text-foreground">{faq.q}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
