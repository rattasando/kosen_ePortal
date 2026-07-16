export const DEFAULT_CONTACT_MAIN = [
  {
    id: "C001",
    icon: "📍",
    label: "ที่อยู่",
    lines: [
      "สำนักงานโครงการ Thai-KOSEN",
      "123 ถนนวิศวกรรมอุตสาหการ แขวงลาดยาว",
      "เขตจตุจักร กรุงเทพมหานคร 10900",
    ],
    href: "",
  },
  {
    id: "C002",
    icon: "📞",
    label: "โทรศัพท์",
    lines: ["+66 2 123 4567"],
    href: "tel:+6621234567",
  },
  {
    id: "C003",
    icon: "✉️",
    label: "อีเมล",
    lines: ["info@kosen.ac.th"],
    href: "mailto:info@kosen.ac.th",
  },
  {
    id: "C004",
    icon: "🕐",
    label: "เวลาทำการ",
    lines: ["จันทร์ – ศุกร์", "08:00 – 17:00 น."],
    href: "",
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
  },
];

export const DEFAULT_CONTACT_SOCIAL = [
  { id: "S001", icon: "📘", label: "Facebook",      handle: "ThaiKOSEN",         href: "#" },
  { id: "S002", icon: "📸", label: "Instagram",     handle: "@thai_kosen",       href: "#" },
  { id: "S003", icon: "▶️", label: "YouTube",       handle: "Thai KOSEN Channel",href: "#" },
  { id: "S004", icon: "💬", label: "LINE Official", handle: "@thaikosen",        href: "#" },
];

export const CONTACT_STORAGE_KEY = "kosen_contact";
export const CONTACT_SEED_KEY    = "kosen_contact_seed";
export const CONTACT_SEED_VER    = "v1r1";
