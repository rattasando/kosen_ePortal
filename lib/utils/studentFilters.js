/**
 * studentFilters.js — pure filter/sort helpers สำหรับ Student module
 *
 * ทุกฟังก์ชันเป็น pure function ไม่มี side effect — unit testable ได้เต็มที่
 */

// ── Search ───────────────────────────────────────────────────

/**
 * ตรวจว่า student record ตรงกับ query หรือไม่
 * ค้นหาจาก field หลักทั้งหมด รวมถึง enrollments และ addresses
 *
 * @param {object} s — student object (มี enrollments[], addresses{th,jp})
 * @param {string} q — query ที่ต้องการค้น (lowercase แล้ว)
 * @returns {boolean}
 */
export function matchStudentField(s, q) {
  const telQ = q.replace(/-/g, "");
  const str = (v) => (v || "").toLowerCase();

  const enrollmentMatch = (s.enrollments ?? []).some(
    (e) =>
      str(e.university).includes(q) ||
      str(e.faculty).includes(q) ||
      str(e.department).includes(q) ||
      str(e.major).includes(q) ||
      str(e.year).includes(q) ||
      str(e.advisor).includes(q) ||
      str(e.project).includes(q) ||
      str(e.studentId).includes(q) ||
      str(e.univEmail).includes(q),
  );

  const addressMatch =
    str(s.addresses?.th?.houseNo).includes(q) ||
    str(s.addresses?.th?.subdistrict).includes(q) ||
    str(s.addresses?.th?.district).includes(q) ||
    str(s.addresses?.th?.province).includes(q) ||
    str(s.addresses?.th?.postalCode).includes(q) ||
    str(s.addresses?.jp?.postalCode).includes(q) ||
    str(s.addresses?.jp?.prefecture).includes(q) ||
    str(s.addresses?.jp?.city).includes(q) ||
    str(s.addresses?.jp?.streetAddress).includes(q) ||
    str(s.addresses?.jp?.building).includes(q);

  return (
    str(s.prefix).includes(q) ||
    str(s.prefixEn).includes(q) ||
    str(s.name).includes(q) ||
    str(s.nameEn).includes(q) ||
    str(s.lastname).includes(q) ||
    str(s.lastnameEn).includes(q) ||
    str(s.nickname).includes(q) ||
    str(s.university).includes(q) ||
    str(s.faculty).includes(q) ||
    str(s.department).includes(q) ||
    str(s.major).includes(q) ||
    str(s.status).includes(q) ||
    str(s.year).includes(q) ||
    str(s.lineId).includes(q) ||
    str(s.email).includes(q) ||
    str(s.advisor).includes(q) ||
    str(s.scholarship).includes(q) ||
    str(s.project).includes(q) ||
    str(s.prevSchool).includes(q) ||
    str(s.country).includes(q) ||
    str(s.address).includes(q) ||
    str(s.nationalId).replace(/-/g, "").includes(q.replace(/-/g, "")) ||
    str(s.passport).includes(q) ||
    str(s.tel).replace(/-/g, "").includes(telQ) ||
    enrollmentMatch ||
    addressMatch
  );
}

// ── Sort ─────────────────────────────────────────────────────

/**
 * เรียงลำดับ student list ตาม sortBy key
 * คืน array ใหม่เสมอ (ไม่ mutate ของเดิม)
 *
 * @param {object[]} list   — student array
 * @param {string}   sortBy — "newest"|"oldest"|"updated"|"th_az"|"th_za"|"en_az"|"en_za"|"default"
 * @returns {object[]}
 */
export function sortStudents(list, sortBy) {
  switch (sortBy) {
    case "newest":
      return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    case "oldest":
      return [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    case "updated":
      return [...list].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    case "th_az":
      return [...list].sort((a, b) =>
        (a.name + a.lastname).localeCompare(b.name + b.lastname, "th"),
      );
    case "th_za":
      return [...list].sort((a, b) =>
        (b.name + b.lastname).localeCompare(a.name + a.lastname, "th"),
      );
    case "en_az":
      return [...list].sort((a, b) =>
        ((a.nameEn || "") + (a.lastnameEn || "")).localeCompare(
          (b.nameEn || "") + (b.lastnameEn || ""),
          "en",
        ),
      );
    case "en_za":
      return [...list].sort((a, b) =>
        ((b.nameEn || "") + (b.lastnameEn || "")).localeCompare(
          (a.nameEn || "") + (a.lastnameEn || ""),
          "en",
        ),
      );
    default:
      return list;
  }
}

// ── Filter ───────────────────────────────────────────────────

/**
 * Helper: คืน enrollment ล่าสุด (endDate === null) หรือตัวท้ายสุด
 * (ซ้ำจาก StudentListClient เพื่อให้ pure function นี้ standalone)
 */
export function getLatestEnrollment(s) {
  if (s.enrollments?.length) {
    const current = [...s.enrollments].reverse().find((e) => !e.endDate);
    return current ?? s.enrollments[s.enrollments.length - 1];
  }
  return {
    university: s.university,
    faculty: s.faculty,
    department: s.department,
    major: s.major,
    year: s.year,
  };
}

/**
 * กรองและเรียงลำดับ student list ตาม filter object ทั้งหมด
 *
 * @param {object[]} students
 * @param {{
 *   keywords:        string[],
 *   searchInput:     string,
 *   filterStatus:    string,
 *   filterUniversity: string,
 *   filterYear:      string,
 *   filterScholarship: string,
 *   filterSelfFunded: boolean,
 *   filterCountry:   string,
 *   sortBy:          string,
 * }} filters
 * @returns {object[]}
 */
export function filterStudents(students, filters) {
  const {
    keywords = [],
    searchInput = "",
    filterStatus = "ทั้งหมด",
    filterUniversity = "ทั้งหมด",
    filterYear = "ทั้งหมด",
    filterScholarship = "ทั้งหมด",
    filterSelfFunded = false,
    filterCountry = "ทั้งหมด",
    sortBy = "default",
  } = filters;

  const base = students.filter((s) => {
    const matchKeywords =
      keywords.length === 0 ||
      keywords.every((kw) => matchStudentField(s, kw.toLowerCase()));
    const matchLive =
      !searchInput.trim() ||
      matchStudentField(s, searchInput.trim().toLowerCase());
    const matchStatus = filterStatus === "ทั้งหมด" || s.status === filterStatus;
    const enrollment = getLatestEnrollment(s);
    const matchUniversity =
      filterUniversity === "ทั้งหมด" || enrollment.university === filterUniversity;
    const matchYear =
      filterYear === "ทั้งหมด" || enrollment.year === filterYear;
    const matchScholarship =
      filterScholarship === "ทั้งหมด" || s.scholarship === filterScholarship;
    const matchSelfFunded = !filterSelfFunded || s.selfFunded === true;
    const studentCountry = s.country === "ญี่ปุ่น" ? "ญี่ปุ่น" : "ไทย";
    const matchCountry =
      filterCountry === "ทั้งหมด" || studentCountry === filterCountry;

    return (
      matchKeywords &&
      matchLive &&
      matchStatus &&
      matchUniversity &&
      matchYear &&
      matchScholarship &&
      matchSelfFunded &&
      matchCountry
    );
  });

  return sortStudents(base, sortBy);
}
