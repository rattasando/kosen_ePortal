// แปลง พ.ศ. → ค.ศ. สำหรับ Date
function buddhistToAD(dateStr) {
  if (!dateStr) return null;
  const [y, m] = dateStr.split("-");
  return new Date(`${parseInt(y) - 543}-${m}-01`);
}

// คำนวณจำนวนปีที่ทำงานทั้งหมด (นับจากงานแรกถึงปัจจุบัน)
export function calcWorkedYears(employmentHistory) {
  if (!employmentHistory?.length) return 0;
  const start = buddhistToAD(employmentHistory[0].startDate);
  const end = new Date();
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.floor(months / 12);
}

// ปีที่แสดงผล — cap ที่ scholarshipYears เมื่อครบหรือได้รับยกเว้นแล้ว
export function calcDisplayedYears(alumni) {
  const worked = calcWorkedYears(alumni.employmentHistory);
  if (alumni.scholarshipStatus !== "กำลังทำงาน") {
    return Math.min(worked, alumni.scholarshipYears);
  }
  return worked;
}

export const ALUMNI = [
  {
    id: "ALM001",
    studentId: "STU-003",
    prefix: "นาย",
    name: "ณัฐพล",
    lastname: "วิริยะกุล",
    nickname: "แต้ม",
    graduatedYear: 2565,
    major: "วิศวกรรมหุ่นยนต์",
    university: "KMITL",
    scholarshipYears: 5,
    scholarshipStatus: "กำลังทำงาน",
    contact: "nattaphol.w@email.com",
    phone: "081-234-5678",
    remark: "ติดตามสัญญาทุนปีที่ 4 — ยังส่งรายงานประจำปีไม่ครบ ต้องติดตามภายใน ก.ย. 69",
    employmentHistory: [
      { company: "Kasetsart Robot Lab", position: "ผู้ช่วยวิจัย", startDate: "2565-06", endDate: "2565-12", location: "กรุงเทพฯ", type: "สัญญาจ้าง" },
      { company: "Thai Automation Co., Ltd.", position: "วิศวกรหุ่นยนต์", startDate: "2566-01", endDate: "2567-06", location: "สมุทรปราการ", type: "พนักงานประจำ" },
      { company: "Mitsubishi Electric Thailand", position: "Senior Automation Engineer", startDate: "2567-07", endDate: null, location: "ชลบุรี", type: "พนักงานประจำ" },
    ],
  },
  {
    id: "ALM002",
    studentId: "STU-023",
    prefix: "นางสาว",
    name: "พิมพ์ชนก",
    lastname: "สุขสวัสดิ์",
    nickname: "พิม",
    graduatedYear: 2565,
    major: "วิศวกรรมอิเล็กทรอนิกส์",
    university: "KMUTT",
    scholarshipYears: 5,
    scholarshipStatus: "ครบตามสัญญา",
    contact: "pimchanok.s@email.com",
    phone: "082-345-6789",
    remark: "",
    employmentHistory: [
      { company: "Delta Electronics Thailand", position: "วิศวกรอิเล็กทรอนิกส์", startDate: "2565-07", endDate: "2567-03", location: "นครปฐม", type: "พนักงานประจำ" },
      { company: "Delta Electronics Thailand", position: "Senior Engineer", startDate: "2567-04", endDate: null, location: "นครปฐม", type: "พนักงานประจำ" },
    ],
  },
  {
    id: "ALM003",
    studentId: "STU-014",
    prefix: "นาย",
    name: "ธนวัฒน์",
    lastname: "อินทรชิต",
    nickname: "ต้น",
    graduatedYear: 2564,
    major: "วิศวกรรมเคมี",
    university: "KMITL",
    scholarshipYears: 5,
    scholarshipStatus: "ได้รับยกเว้น",
    contact: "thanawat.i@email.com",
    phone: "083-456-7890",
    remark: "ได้รับยกเว้นสัญญาเนื่องจากลาออกจากงานเพื่อดูแลบิดาป่วยหนัก — มีเอกสารรับรองแพทย์แนบในแฟ้ม",
    employmentHistory: [
      { company: "PTT Global Chemical", position: "วิศวกรกระบวนการ", startDate: "2564-06", endDate: "2565-12", location: "ระยอง", type: "พนักงานประจำ" },
      { company: "PTT Global Chemical", position: "Process Engineer II", startDate: "2566-01", endDate: "2567-06", location: "ระยอง", type: "พนักงานประจำ" },
      { company: "IRPC Public Company", position: "Senior Process Engineer", startDate: "2567-07", endDate: null, location: "ระยอง", type: "พนักงานประจำ" },
    ],
  },
  {
    id: "ALM004",
    studentId: "STU-041",
    prefix: "นางสาว",
    name: "สุภาภรณ์",
    lastname: "แก้วประดิษฐ์",
    nickname: "ภา",
    graduatedYear: 2564,
    major: "วิศวกรรมโยธา",
    university: "KMUTT",
    scholarshipYears: 5,
    scholarshipStatus: "กำลังทำงาน",
    contact: "supaporn.k@email.com",
    phone: "084-567-8901",
    remark: "",
    employmentHistory: [
      { company: "Italian-Thai Development", position: "วิศวกรโยธา", startDate: "2564-07", endDate: "2566-06", location: "กรุงเทพฯ", type: "พนักงานประจำ" },
      { company: "CH. Karnchang PCL", position: "Project Engineer", startDate: "2566-07", endDate: null, location: "กรุงเทพฯ", type: "พนักงานประจำ" },
    ],
  },
  {
    id: "ALM005",
    studentId: "STU-038",
    prefix: "นาย",
    name: "กิตติภูมิ",
    lastname: "ตันติวรรณ",
    nickname: "ภูมิ",
    graduatedYear: 2563,
    major: "วิศวกรรมวัสดุ",
    university: "KMITL",
    scholarshipYears: 5,
    scholarshipStatus: "ครบตามสัญญา",
    contact: "kittiphum.t@email.com",
    phone: "085-678-9012",
    remark: "",
    employmentHistory: [
      { company: "SiamSteel Co., Ltd.", position: "วิศวกรวัสดุ", startDate: "2563-07", endDate: "2564-12", location: "สระบุรี", type: "พนักงานประจำ" },
      { company: "Toyota Motor Thailand", position: "Material Engineer", startDate: "2565-01", endDate: "2566-06", location: "สมุทรปราการ", type: "พนักงานประจำ" },
      { company: "Toyota Motor Thailand", position: "Sr. Material Engineer", startDate: "2566-07", endDate: null, location: "สมุทรปราการ", type: "พนักงานประจำ" },
    ],
  },
  {
    id: "ALM006",
    studentId: "STU-051",
    prefix: "นางสาว",
    name: "วรรณิษา",
    lastname: "ดีสม",
    nickname: "แนน",
    graduatedYear: 2563,
    major: "วิศวกรรมคอมพิวเตอร์",
    university: "KMUTT",
    scholarshipYears: 5,
    scholarshipStatus: "ครบตามสัญญา",
    contact: "wannisa.d@email.com",
    phone: "086-789-0123",
    remark: "สนใจกลับมาเป็นวิทยากรรับเชิญ — ติดต่อประสานงานเพื่อจัดบรรยายในภาคการศึกษาหน้า",
    employmentHistory: [
      { company: "LINE Thailand", position: "Software Engineer", startDate: "2563-06", endDate: "2565-05", location: "กรุงเทพฯ", type: "พนักงานประจำ" },
      { company: "Agoda", position: "Backend Engineer", startDate: "2565-06", endDate: null, location: "กรุงเทพฯ", type: "พนักงานประจำ" },
    ],
  },
  {
    id: "ALM007",
    studentId: "STU-061",
    prefix: "นาย",
    name: "ปิยะพงษ์",
    lastname: "แสงทอง",
    nickname: "บิ๊ก",
    graduatedYear: 2562,
    major: "วิศวกรรมไฟฟ้า",
    university: "KMITL",
    scholarshipYears: 5,
    scholarshipStatus: "ครบตามสัญญา",
    contact: "piyaphong.s@email.com",
    phone: "087-890-1234",
    remark: "",
    employmentHistory: [
      { company: "MEA การไฟฟ้านครหลวง", position: "วิศวกรไฟฟ้า", startDate: "2562-07", endDate: "2564-12", location: "กรุงเทพฯ", type: "พนักงานประจำ" },
      { company: "Schneider Electric Thailand", position: "Application Engineer", startDate: "2565-01", endDate: "2566-12", location: "กรุงเทพฯ", type: "พนักงานประจำ" },
      { company: "Schneider Electric Thailand", position: "Senior Application Engineer", startDate: "2567-01", endDate: null, location: "กรุงเทพฯ", type: "พนักงานประจำ" },
    ],
  },
  {
    id: "ALM008",
    studentId: "STU-071",
    prefix: "นางสาว",
    name: "ชนม์นิภา",
    lastname: "รุ่งเรือง",
    nickname: "นิ",
    graduatedYear: 2562,
    major: "วิศวกรรมสิ่งแวดล้อม",
    university: "KMUTT",
    scholarshipYears: 5,
    scholarshipStatus: "กำลังทำงาน",
    contact: "chonnipa.r@email.com",
    phone: "088-901-2345",
    remark: "",
    employmentHistory: [
      { company: "PEA การไฟฟ้าส่วนภูมิภาค", position: "วิศวกรสิ่งแวดล้อม", startDate: "2562-08", endDate: "2565-07", location: "นนทบุรี", type: "พนักงานประจำ" },
      { company: "EGCO Group", position: "Environmental Specialist", startDate: "2565-08", endDate: null, location: "กรุงเทพฯ", type: "พนักงานประจำ" },
    ],
  },
  {
    id: "ALM009",
    studentId: "STU-081",
    prefix: "นาย",
    name: "ภาณุวัฒน์",
    lastname: "จิตรดี",
    nickname: "นุ",
    graduatedYear: 2561,
    major: "วิศวกรรมอุตสาหการ",
    university: "KMITL",
    scholarshipYears: 5,
    scholarshipStatus: "ครบตามสัญญา",
    contact: "phanuwat.j@email.com",
    phone: "089-012-3456",
    remark: "",
    employmentHistory: [
      { company: "Hana Microelectronics", position: "IE Engineer", startDate: "2561-07", endDate: "2563-06", location: "ปทุมธานี", type: "พนักงานประจำ" },
      { company: "Western Digital Thailand", position: "Sr. IE Engineer", startDate: "2563-07", endDate: "2565-12", location: "บางกอกน้อย", type: "พนักงานประจำ" },
      { company: "Western Digital Thailand", position: "IE Manager", startDate: "2566-01", endDate: null, location: "บางกอกน้อย", type: "พนักงานประจำ" },
    ],
  },
  {
    id: "ALM010",
    studentId: "STU-091",
    prefix: "นางสาว",
    name: "อารีรัตน์",
    lastname: "พุ่มไพร",
    nickname: "รัตน์",
    graduatedYear: 2561,
    major: "วิศวกรรมชีวการแพทย์",
    university: "KMUTT",
    scholarshipYears: 5,
    scholarshipStatus: "กำลังทำงาน",
    contact: "areerat.p@email.com",
    phone: "090-123-4567",
    remark: "อยู่ระหว่างขอผ่อนผันสัญญา — รอเอกสารจากต่างประเทศ ติดตามอีกครั้ง ธ.ค. 69",
    employmentHistory: [
      { company: "Bumrungrad International Hospital", position: "Biomedical Engineer", startDate: "2561-08", endDate: "2563-12", location: "กรุงเทพฯ", type: "พนักงานประจำ" },
      { company: "Siemens Healthineers Thailand", position: "Clinical Application Specialist", startDate: "2564-01", endDate: "2566-06", location: "กรุงเทพฯ", type: "พนักงานประจำ" },
      { company: "Siemens Healthineers Thailand", position: "Senior Clinical Specialist", startDate: "2566-07", endDate: null, location: "กรุงเทพฯ", type: "พนักงานประจำ" },
    ],
  },
];

export const SCHOLARSHIP_STATUS_COLOR = {
  "กำลังทำงาน":   { badge: "bg-amber-100 text-amber-700",   bar: "bg-amber-400" },
  "ครบตามสัญญา":  { badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" },
  "ได้รับยกเว้น": { badge: "bg-violet-100 text-violet-700", bar: "bg-violet-500" },
};
