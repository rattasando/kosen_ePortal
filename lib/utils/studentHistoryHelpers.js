export const FIELD_LABELS = {
  id:              "รหัสนักเรียน",
  status:          "สถานะ",
  scholarship:     "ทุนการศึกษา",
  selfFunded:      "จ่ายค่าเรียนเอง",
  prefix:          "คำนำหน้า (ไทย)",
  name:            "ชื่อ",
  lastname:        "นามสกุล",
  prefixEn:        "คำนำหน้า (EN)",
  nameEn:          "First Name (EN)",
  lastnameEn:      "Last Name (EN)",
  nickname:        "ชื่อเล่น",
  gender:          "เพศ",
  dob:             "วันเกิด",
  nationalId:      "เลขบัตรประชาชน",
  passport:        "เลข Passport",
  militaryStatus:  "สถานะเกณฑ์ทหาร",
  country:         "ประเทศที่พำนักปัจจุบัน",
  tel:             "เบอร์โทรศัพท์",
  email:           "อีเมล",
  lineId:          "LINE ID",
  prevSchool:      "โรงเรียนเดิม",
  bankName:        "ธนาคาร",
  bankBranch:      "สาขาธนาคาร",
  bankAccountNo:   "เลขที่บัญชี",
  departureDateTH: "วันออกเดินทาง",
  departureDateTh: "วันออกเดินทาง",
  arrivalDateJP:   "วันถึงญี่ปุ่น",
  arrivalDateJp:   "วันถึงญี่ปุ่น",
  note:            "หมายเหตุ",
};

const ADDR_TH_LABELS = {
  houseNo:     "บ้านเลขที่ / ซอย / ถนน (ไทย)",
  subdistrict: "แขวง / ตำบล (ไทย)",
  district:    "เขต / อำเภอ (ไทย)",
  province:    "จังหวัด (ไทย)",
  postalCode:  "รหัสไปรษณีย์ (ไทย)",
};

const ADDR_JP_LABELS = {
  postalCode:    "รหัสไปรษณีย์ (ญี่ปุ่น)",
  prefecture:    "จังหวัด (ญี่ปุ่น)",
  city:          "เมือง / เขต (ญี่ปุ่น)",
  streetAddress: "ที่อยู่ (ญี่ปุ่น)",
  building:      "อาคาร / ห้อง (ญี่ปุ่น)",
};

const ENROLLMENT_LABELS = {
  university: "มหาวิทยาลัย",
  studentId:  "รหัสนักศึกษา",
  univEmail:  "อีเมลสถาบัน",
  faculty:    "คณะ",
  department: "ภาควิชา",
  major:      "สาขาวิชา",
  year:       "ชั้นปี",
  advisor:    "อาจารย์ที่ปรึกษา",
  project:    "หัวข้อโปรเจกต์",
};

function str(v) {
  return v == null ? "" : String(v);
}

function diffAddresses(before, after, changes) {
  const bTH = before?.th ?? {};
  const aTH = after?.th  ?? {};
  for (const key of Object.keys(ADDR_TH_LABELS)) {
    if (str(bTH[key]) !== str(aTH[key])) {
      changes.push({ field: `addresses.th.${key}`, label: ADDR_TH_LABELS[key], before: str(bTH[key]) || "—", after: str(aTH[key]) || "—" });
    }
  }
  const bJP = before?.jp ?? {};
  const aJP = after?.jp  ?? {};
  for (const key of Object.keys(ADDR_JP_LABELS)) {
    if (str(bJP[key]) !== str(aJP[key])) {
      changes.push({ field: `addresses.jp.${key}`, label: ADDR_JP_LABELS[key], before: str(bJP[key]) || "—", after: str(aJP[key]) || "—" });
    }
  }
}

function diffEnrollments(before, after, changes) {
  const bArr = Array.isArray(before) ? before : [];
  const aArr = Array.isArray(after)  ? after  : [];
  const len  = Math.max(bArr.length, aArr.length);
  for (let i = 0; i < len; i++) {
    const bE = bArr[i] ?? {};
    const aE = aArr[i] ?? {};
    const suffix = len > 1 ? ` (สถาบัน ${i + 1})` : "";
    for (const key of Object.keys(ENROLLMENT_LABELS)) {
      if (str(bE[key]) !== str(aE[key])) {
        changes.push({
          field:  `enrollments[${i}].${key}`,
          label:  ENROLLMENT_LABELS[key] + suffix,
          before: str(bE[key]) || "—",
          after:  str(aE[key]) || "—",
        });
      }
    }
  }
}

export function diffSnapshot(before, after) {
  const changes = [];
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);

  for (const key of keys) {
    if (key === "addresses") {
      diffAddresses(before?.addresses, after?.addresses, changes);
      continue;
    }
    if (key === "enrollments") {
      diffEnrollments(before?.enrollments, after?.enrollments, changes);
      continue;
    }
    if (!FIELD_LABELS[key]) continue;
    const b = str(before?.[key] ?? "");
    const a = str(after?.[key]  ?? "");
    if (b !== a) {
      changes.push({ field: key, label: FIELD_LABELS[key], before: b || "—", after: a || "—" });
    }
  }
  return changes;
}

export function buildSummary(type, changes) {
  if (type === "create") return "สร้างข้อมูลนักเรียนใหม่";
  if (type === "delete") return "ลบข้อมูลนักเรียน";
  if (!changes.length)   return "บันทึกข้อมูล (ไม่มีการเปลี่ยนแปลง)";
  if (changes.length === 1) {
    const c = changes[0];
    return `แก้ไข ${c.label}: ${c.before} → ${c.after}`;
  }
  return `แก้ไข ${changes.length} ฟิลด์: ${changes.map((c) => c.label).join(", ")}`;
}

export function formatHistoryDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString("th-TH", {
    year:   "numeric",
    month:  "short",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}
