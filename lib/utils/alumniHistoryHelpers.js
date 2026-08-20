// Field labels for alumni history diffs

export const ALUMNI_FIELD_LABELS = {
  prefix:           "คำนำหน้า",
  name:             "ชื่อ",
  lastname:         "นามสกุล",
  nameEn:           "First Name (EN)",
  lastnameEn:       "Last Name (EN)",
  nickname:         "ชื่อเล่น",
  major:            "สาขา",
  university:       "มหาวิทยาลัย",
  graduatedYear:    "ปีที่จบ (พ.ศ.)",
  contact:          "อีเมล",
  phone:            "โทรศัพท์",
  scholarshipYears: "จำนวนปีตามสัญญาทุน",
  scholarshipStatus:"สถานะการทำงานตามสัญญา",
  remark:           "หมายเหตุ",
};

function str(v) {
  return v == null ? "" : String(v);
}

function diffEmploymentHistory(before, after, changes) {
  const bArr = Array.isArray(before) ? before : [];
  const aArr = Array.isArray(after) ? after : [];

  // If lengths differ, just note that
  if (bArr.length !== aArr.length) {
    changes.push({
      field: "employmentHistory.count",
      label: "จำนวนที่ทำงาน",
      before: `${bArr.length} บริษัท`,
      after:  `${aArr.length} บริษัท`,
    });
  }

  // Diff each position
  const len = Math.max(bArr.length, aArr.length);
  const JOB_KEYS = ["company", "position", "startDate", "endDate", "location", "type"];
  const JOB_LABELS = {
    company:   "บริษัท",
    position:  "ตำแหน่ง",
    startDate: "วันเริ่มงาน",
    endDate:   "วันสิ้นสุด",
    location:  "สถานที่",
    type:      "ประเภทการจ้าง",
  };

  for (let i = 0; i < len; i++) {
    const bE = bArr[i] ?? {};
    const aE = aArr[i] ?? {};
    const suffix = `(บริษัทที่ ${i + 1})`;
    for (const key of JOB_KEYS) {
      const bv = str(bE[key] ?? "");
      const av = str(aE[key] ?? "");
      if (bv !== av) {
        changes.push({
          field:  `employmentHistory[${i}].${key}`,
          label:  `${JOB_LABELS[key]} ${suffix}`,
          before: bv || "—",
          after:  av || "—",
        });
      }
    }
  }
}

export function diffAlumniSnapshot(before, after) {
  const changes = [];
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);

  for (const key of keys) {
    if (key === "employmentHistory") {
      diffEmploymentHistory(before?.employmentHistory, after?.employmentHistory, changes);
      continue;
    }
    if (!ALUMNI_FIELD_LABELS[key]) continue;
    const b = str(before?.[key] ?? "");
    const a = str(after?.[key] ?? "");
    if (b !== a) {
      changes.push({ field: key, label: ALUMNI_FIELD_LABELS[key], before: b || "—", after: a || "—" });
    }
  }
  return changes;
}

export function buildAlumniSummary(type, changes) {
  if (type === "create") return "สร้างข้อมูลศิษย์เก่าใหม่";
  if (type === "delete") return "ลบข้อมูลศิษย์เก่า";
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
