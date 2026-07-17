export const DEFAULT_CONTACT_MAIN = [
  {
    id: "C004",
    icon: "🕐",
    label: "เวลาทำการ",
    lines: ["จันทร์ – ศุกร์", "08:00 – 17:00น."],
    href: "",
    span: 1,
  },
  {
    id: "C001",
    icon: "📍",
    label: "ที่อยู่",
    lines: [
      "สำนักงานโครงการสถาบันไทยโคเซ็น",
      "กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม",
      "ถนนศรีอยุธยา (อาคารอุดมศึกษา 2) 328 ถ.ศรีอยุธยา แขวงทุ่งพญาไท เขตราชเทวี กรุงเทพฯ 10400",
    ],
    href: "",
    span: 1.5,
  },
  {
    id: "C005",
    icon: "✉️",
    label: "อีเมล",
    lines: ["thaikosen@mhesi.go.th"],
    href: "",
    span: 1,
  },
  {
    id: "C002",
    icon: "📞",
    label: "โทรศัพท์",
    lines: ["02 610 5200"],
    href: "",
    span: 0.5,
  },
];

export const DEFAULT_CONTACT_UNIVERSITIES = [
  {
    id: "U001",
    name: "KMITL",
    fullName: "สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง",
    location: "กรุงเทพมหานคร",
    phone: "+66 2 329 8000",
    email: "kosen@kmitl.ac.th",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    dot: "bg-blue-500",
    span: 2,
  },
  {
    id: "U002",
    name: "KMUTT",
    fullName: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี",
    location: "กรุงเทพมหานคร",
    phone: "+66 2 470 8000",
    email: "kosen@kmutt.ac.th",
    color: "bg-green-50 border-green-200 text-green-700",
    dot: "bg-green-500",
    span: 2,
  },
];

export const DEFAULT_CONTACT_SOCIAL = [
  { id: "S001", icon: "📘", label: "Facebook",      handle: "ThaiKOSEN",          href: "#" },
  { id: "S002", icon: "📸", label: "Instagram",     handle: "@thai_kosen",        href: "#" },
  { id: "S003", icon: "▶️", label: "YouTube",       handle: "Thai KOSEN Channel", href: "#" },
];

export const CONTACT_STORAGE_KEY = "kosen_contact";
export const CONTACT_SEED_KEY    = "kosen_contact_seed";
export const CONTACT_SEED_VER    = "v1r2";
