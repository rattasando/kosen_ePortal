export const DEFAULT_CONTACT_MAIN = [
  {
    id: "C004",
    icon: "🕐",
    label: "เวลาทำการ",
    lines: ["จันทร์ – ศุกร์", "08:00 – 17:00น."],
    href: "",
    span: 0.75,
    fontSize: "base",
  },
  {
    id: "C001",
    icon: "📍",
    label: "ที่อยู่",
    lines: [
      "สำนักงานโครงการสถาบันไทยโคเซ็น",
      "กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม",
      "ถนนศรีอยุธยา (อาคารอุดมศึกษา 2) 328 ถ.ศรีอยุธยา",
      "แขวงทุ่งพญาไท เขตราชเทวี กรุงเทพฯ 10400",
    ],
    href: "",
    span: 1.5,
    fontSize: "base",
  },
  {
    id: "C005",
    icon: "✉️",
    label: "อีเมล",
    lines: ["thaikosen@mhesi.go.th"],
    href: "",
    span: 1,
    fontSize: "base",
  },
  {
    id: "C002",
    icon: "📞",
    label: "โทรศัพท์",
    lines: ["02 610 5200"],
    href: "tel:02 610 5200",
    span: 0.75,
    fontSize: "base",
  },
];

export const DEFAULT_CONTACT_UNIVERSITIES = [
  {
    id: "U001",
    name: "KOSEN-KMITL",
    fullName: "สถาบันโคเซ็นแห่งสถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง",
    location: "กรุงเทพมหานคร",
    phone: "(+66)9-6-805-9827",
    email: "kosen@kmitl.ac.th",
    website: "http://kosen.kmitl.ac.th/th",
    facebook: "https://www.facebook.com/KOSENKMITL/",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    dot: "bg-blue-500",
    span: 2,
  },
  {
    id: "U002",
    name: "KOSEN-KMUTT",
    fullName: "สถาบันโคเซ็นแห่งสถาบันเทคโนโลยีพระจอมเกล้าธนบุรี",
    location: "กรุงเทพมหานคร",
    phone: "(+66)0-2-470-8389",
    email: "esc@mail.kmutt.ac.th",
    website: "https://gifted.kmutt.ac.th/th/home",
    facebook: "https://www.facebook.com/KMUTTKOSEN/",
    color: "bg-green-50 border-green-200 text-green-700",
    dot: "bg-green-500",
    span: 2,
  },
];

export const DEFAULT_CONTACT_SOCIAL = [
  {
    id: "S001",
    icon: "📘",
    label: "Facebook",
    handle: "ThaiKOSEN",
    href: "https://www.facebook.com/ThaiKOSENofficial",
  },
];

export const CONTACT_STORAGE_KEY = "kosen_contact";
export const CONTACT_SEED_KEY = "kosen_contact_seed";
export const CONTACT_SEED_VER = "v1r8";
