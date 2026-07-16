import Image from "next/image";
import Link from "next/link";

const UNIVERSITIES = [
  {
    name: "สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง",
    short: "KMITL",
    location: "กรุงเทพมหานคร",
    faculties: [
      "วิศวกรรมเครื่องกลและการบิน-อวกาศ",
      "วิศวกรรมไฟฟ้าและอิเล็กทรอนิกส์",
      "วิศวกรรมโยธา",
    ],
    image: "/banners/banner1.jpg",
    color: "from-blue-600 to-blue-800",
  },
  {
    name: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี",
    short: "KMUTT",
    location: "กรุงเทพมหานคร",
    faculties: [
      "วิศวกรรมเครื่องกล",
      "วิศวกรรมอิเล็กทรอนิกส์",
      "วิศวกรรมคอมพิวเตอร์",
    ],
    image: "/banners/banner2.jpg",
    color: "from-green-600 to-green-800",
  },
];

const FEATURES = [
  {
    icon: "🎓",
    title: "หลักสูตร 5 ปี",
    desc: "ต่อยอดจากมัธยมศึกษาตอนต้น (ม.3) เข้าสู่หลักสูตรวิศวกรรม 5 ปีเต็มตามแบบ KOSEN ญี่ปุ่น",
  },
  {
    icon: "🏭",
    title: "เน้นการปฏิบัติจริง",
    desc: "ฝึกงานในโรงงานและบริษัทชั้นนำตั้งแต่ปีที่ 3 สะสมชั่วโมงประสบการณ์จริงก่อนจบการศึกษา",
  },
  {
    icon: "🇯🇵",
    title: "ร่วมมือกับญี่ปุ่น",
    desc: "ได้รับการสนับสนุนจาก KOSEN ญี่ปุ่น แลกเปลี่ยนอาจารย์และนักศึกษา รวมถึงโอกาสศึกษาต่อในญี่ปุ่น",
  },
  {
    icon: "🔬",
    title: "วิจัยและนวัตกรรม",
    desc: "ทุกคนมีโปรเจกต์วิจัยเฉพาะตั้งแต่ปีที่ 3 ภายใต้การดูแลของอาจารย์ที่ปรึกษาผู้เชี่ยวชาญ",
  },
  {
    icon: "💼",
    title: "บัณฑิตที่ตลาดต้องการ",
    desc: "บัณฑิต KOSEN มีอัตราการมีงานทำ 97% ภายใน 6 เดือน จากเครือข่ายพาร์ทเนอร์กว่า 200 บริษัท",
  },
  {
    icon: "🌏",
    title: "มาตรฐานสากล",
    desc: "หลักสูตรได้รับการรับรองจาก ABET และ JABEE ทำให้วุฒิบัตรเป็นที่ยอมรับในระดับนานาชาติ",
  },
];

const TIMELINE = [
  {
    year: "ม.3 จบ",
    label: "รับสมัคร",
    desc: "เปิดรับนักเรียนที่จบ ม.3 หรือเทียบเท่า ผ่านการสอบข้อเขียนและสัมภาษณ์",
  },
  {
    year: "ปี 1–2",
    label: "วิทยาศาสตร์พื้นฐาน",
    desc: "คณิตศาสตร์ ฟิสิกส์ เคมี และพื้นฐานวิศวกรรม ควบคู่กับภาษาอังกฤษและภาษาญี่ปุ่น",
  },
  {
    year: "ปี 3",
    label: "เริ่มวิชาชีพ + โปรเจกต์",
    desc: "เข้าสู่วิชาเฉพาะสาขา เริ่มโปรเจกต์วิจัยภายใต้อาจารย์ที่ปรึกษา",
  },
  {
    year: "ปี 4",
    label: "ฝึกงานอุตสาหกรรม",
    desc: "ฝึกงานในบริษัทพาร์ทเนอร์ไม่น้อยกว่า 1 ภาคการศึกษา",
  },
  {
    year: "ปี 5",
    label: "โปรเจกต์จบการศึกษา",
    desc: "นำเสนอผลงานวิจัยระดับวิศวกรรมต่อคณะกรรมการผู้เชี่ยวชาญจากอุตสาหกรรม",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white pb-20">

      {/* ── Page header ── */}
      <div className="border-b border-border bg-white pt-8 pb-6">
        <div className="page-container">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">เกี่ยวกับเรา</h1>
        </div>
      </div>

      {/* What is KOSEN */}
      <div className="page-container py-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            KOSEN คืออะไร?
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
            โมเดลการศึกษาที่พิสูจน์แล้วจากญี่ปุ่น
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            KOSEN (工業高等専門学校)
            คือสถาบันเทคโนโลยีชั้นสูงของญี่ปุ่นที่มีประวัติยาวนานกว่า 60 ปี
            ผลิตวิศวกรและนักวิทยาศาสตร์ที่มีทักษะปฏิบัติสูง
            ประเทศไทยนำโมเดลนี้มาปรับใช้ในรูปแบบ Thai-KOSEN
            โดยความร่วมมือระหว่างกระทรวงศึกษาธิการไทยและ NICT Japan
            เพื่อยกระดับทักษะวิศวกรไทยสู่มาตรฐานสากล
          </p>
        </div>

        {/* Features */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-2xl">
                {f.icon}
              </div>
              <h3 className="text-base font-bold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-base leading-relaxed text-muted">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="border-y border-border bg-slate-50 py-12">
        <div className="page-container">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              เส้นทางการศึกษา
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
              5 ปีสู่วิศวกรมืออาชีพ
            </h2>
          </div>
          <div className="relative mx-auto max-w-2xl">
            <div className="absolute left-6 top-0 h-full w-px bg-border" />
            <div className="space-y-8">
              {TIMELINE.map((item, i) => (
                <div key={i} className="relative flex gap-5">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-surface text-xs font-bold text-primary">
                    {i + 1}
                  </div>
                  <div className="flex-1 pb-2 pt-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-3 py-0.5 text-sm font-bold text-primary">
                        {item.year}
                      </span>
                      <h3 className="text-base font-bold text-foreground">
                        {item.label}
                      </h3>
                    </div>
                    <p className="mt-1 text-base text-muted">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Universities */}
      <div className="page-container py-12">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            สถาบันพาร์ทเนอร์
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
            2 มหาวิทยาลัยชั้นนำ
          </h2>
          <p className="mt-2 text-sm text-muted">
            โครงการ Thai-KOSEN เปิดดำเนินการใน 2
            มหาวิทยาลัยเทคโนโลยีชั้นนำของไทย
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
          {UNIVERSITIES.map((u) => (
            <div key={u.short} className="card overflow-hidden">
              <div
                className={`relative h-32 bg-gradient-to-br ${u.color} flex items-center justify-center`}
              >
                <span className="text-4xl font-extrabold text-white/20">
                  {u.short}
                </span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-extrabold tracking-tight text-white">
                    {u.short}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-base font-bold text-foreground leading-snug">
                  {u.name}
                </h3>
                <p className="mt-1 text-sm text-muted">📍 {u.location}</p>
                <div className="mt-3 space-y-1">
                  {u.faculties.map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 text-sm text-muted"
                    >
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
