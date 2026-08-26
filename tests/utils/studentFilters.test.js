import { describe, it, expect } from "vitest";
import {
  matchStudentField,
  sortStudents,
  filterStudents,
  getLatestEnrollment,
} from "../../lib/utils/studentFilters";

// ── test fixtures ─────────────────────────────────────────────

const mkStudent = (overrides = {}) => ({
  id: "STU-001",
  prefix: "นาย",
  prefixEn: "Mr.",
  name: "สมชาย",
  nameEn: "Somchai",
  lastname: "ใจดี",
  lastnameEn: "Jaidee",
  nickname: "ชาย",
  gender: "ชาย",
  nationalId: "1-2345-67890-12-3",
  passport: "AA123456",
  tel: "081-234-5678",
  email: "somchai@example.com",
  lineId: "somchai_line",
  scholarship: "ทุน 2 ปี",
  prevSchool: "โรงเรียนอุดมศึกษา",
  country: "ไทย",
  status: "กำลังศึกษา",
  selfFunded: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-06-01T00:00:00.000Z",
  enrollments: [
    {
      university: "KMUTT",
      faculty: "วิศวกรรมศาสตร์",
      department: "คอมพิวเตอร์",
      major: "วิศวกรรมซอฟต์แวร์",
      year: "3",
      advisor: "อ.สมศักดิ์",
      project: "ระบบจัดการห้องสมุด",
      studentId: "64040501010",
      univEmail: "s64040501010@email.kmutt.ac.th",
      endDate: null,
    },
  ],
  addresses: {
    th: {
      houseNo: "123",
      subdistrict: "บางมด",
      district: "ทุ่งครุ",
      province: "กรุงเทพมหานคร",
      postalCode: "10140",
    },
    jp: {
      postalCode: "153-0051",
      prefecture: "Tokyo",
      city: "Meguro",
      streetAddress: "1-1-1",
      building: "Apts 201",
    },
  },
  ...overrides,
});

// ── matchStudentField ─────────────────────────────────────────

describe("matchStudentField", () => {
  const s = mkStudent();

  it("ค้นจากชื่อไทย", () => {
    expect(matchStudentField(s, "สมชาย")).toBe(true);
  });

  it("ค้นจากนามสกุล", () => {
    expect(matchStudentField(s, "ใจดี")).toBe(true);
  });

  it("ค้นจากชื่อเล่น", () => {
    expect(matchStudentField(s, "ชาย")).toBe(true);
  });

  it("ค้นจากชื่ออังกฤษ (case-insensitive)", () => {
    expect(matchStudentField(s, "somchai")).toBe(true);
    expect(matchStudentField(s, "SOMCHAI")).toBe(false); // q ต้อง lowercase ก่อน
    expect(matchStudentField(s, "jaidee")).toBe(true);
  });

  it("ค้นจาก nationalId — strip ขีดออกก่อนเทียบ", () => {
    expect(matchStudentField(s, "1234567890123")).toBe(true);
    expect(matchStudentField(s, "1-2345-67890-12-3")).toBe(true);
  });

  it("ค้นจาก email", () => {
    expect(matchStudentField(s, "somchai@example")).toBe(true);
  });

  it("ค้นจาก tel — strip ขีด", () => {
    expect(matchStudentField(s, "0812345678")).toBe(true);
  });

  it("ค้นจาก enrollment field", () => {
    expect(matchStudentField(s, "kmutt")).toBe(true);
    expect(matchStudentField(s, "วิศวกรรมซอฟต์แวร์")).toBe(true);
    expect(matchStudentField(s, "สมศักดิ์")).toBe(true);
    expect(matchStudentField(s, "64040501010")).toBe(true);
  });

  it("ค้นจาก address (ไทย)", () => {
    expect(matchStudentField(s, "กรุงเทพ")).toBe(true);
    expect(matchStudentField(s, "10140")).toBe(true);
  });

  it("ค้นจาก address (ญี่ปุ่น)", () => {
    expect(matchStudentField(s, "meguro")).toBe(true);
    expect(matchStudentField(s, "153-0051")).toBe(true);
  });

  it("ไม่ตรง — คืน false", () => {
    expect(matchStudentField(s, "xxxxxxxx")).toBe(false);
  });

  it("empty query — คืน true (JS includes behavior; consumer guard ก่อนเรียก)", () => {
    // "".includes("") === true เป็น JS spec — filterStudents guard ด้วย !searchInput.trim() อยู่แล้ว
    expect(matchStudentField(s, "")).toBe(true);
  });

  it("student ไม่มี enrollments — ไม่ crash", () => {
    const noEnroll = mkStudent({ enrollments: undefined });
    expect(matchStudentField(noEnroll, "kmutt")).toBe(false);
    expect(matchStudentField(noEnroll, "สมชาย")).toBe(true);
  });

  it("student ไม่มี addresses — ไม่ crash", () => {
    const noAddr = mkStudent({ addresses: undefined });
    expect(matchStudentField(noAddr, "กรุงเทพ")).toBe(false);
    expect(matchStudentField(noAddr, "สมชาย")).toBe(true);
  });
});

// ── sortStudents ─────────────────────────────────────────────

describe("sortStudents", () => {
  const students = [
    mkStudent({ id: "A", name: "สมชาย", lastname: "ใจดี",   createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-06-01T00:00:00.000Z" }),
    mkStudent({ id: "B", name: "สมหญิง", lastname: "มีสุข", createdAt: "2024-03-01T00:00:00.000Z", updatedAt: "2024-09-01T00:00:00.000Z" }),
    mkStudent({ id: "C", name: "อรุณ", lastname: "แก้ว",    createdAt: "2022-05-01T00:00:00.000Z", updatedAt: "2024-01-01T00:00:00.000Z" }),
  ];

  it("newest — เรียงจาก createdAt ใหม่สุด", () => {
    const sorted = sortStudents(students, "newest");
    expect(sorted.map((s) => s.id)).toEqual(["B", "A", "C"]);
  });

  it("oldest — เรียงจาก createdAt เก่าสุด", () => {
    const sorted = sortStudents(students, "oldest");
    expect(sorted.map((s) => s.id)).toEqual(["C", "A", "B"]);
  });

  it("updated — เรียงจาก updatedAt ใหม่สุด", () => {
    const sorted = sortStudents(students, "updated");
    expect(sorted.map((s) => s.id)).toEqual(["B", "A", "C"]);
  });

  it("th_az — เรียงตามชื่อไทย ก→ฮ", () => {
    const sorted = sortStudents(students, "th_az");
    // "สมชาย" < "สมหญิง" < "อรุณ" (ตามลำดับ Unicode ภาษาไทย)
    expect(sorted[0].id).toBe("A"); // สมชายใจดี
    expect(sorted[2].id).toBe("C"); // อรุณแก้ว
  });

  it("th_za — เรียงตามชื่อไทย ฮ→ก (reverse)", () => {
    const sorted = sortStudents(students, "th_za");
    expect(sorted[0].id).toBe("C"); // อรุณ อยู่ท้ายใน az → อยู่ต้นใน za
  });

  it("default — คืน array เดิม (ไม่เรียงใหม่)", () => {
    const sorted = sortStudents(students, "default");
    expect(sorted.map((s) => s.id)).toEqual(["A", "B", "C"]);
  });

  it("ไม่ mutate array ต้นฉบับ", () => {
    const original = [...students];
    sortStudents(students, "newest");
    expect(students.map((s) => s.id)).toEqual(original.map((s) => s.id));
  });
});

// ── getLatestEnrollment ───────────────────────────────────────

describe("getLatestEnrollment", () => {
  it("คืน enrollment ที่ endDate === null (สถาบันปัจจุบัน)", () => {
    const s = mkStudent({
      enrollments: [
        { university: "KMUTT", endDate: "2023-03-01" },
        { university: "Tokyo", endDate: null },
      ],
    });
    expect(getLatestEnrollment(s).university).toBe("Tokyo");
  });

  it("ถ้าทุก enrollment มี endDate — คืนตัวท้ายสุดของ array", () => {
    const s = mkStudent({
      enrollments: [
        { university: "A", endDate: "2020-03-01" },
        { university: "B", endDate: "2023-03-01" },
      ],
    });
    expect(getLatestEnrollment(s).university).toBe("B");
  });

  it("ไม่มี enrollments — fallback ไป flat field", () => {
    const s = mkStudent({ enrollments: undefined, university: "TestU" });
    expect(getLatestEnrollment(s).university).toBe("TestU");
  });
});

// ── filterStudents ────────────────────────────────────────────

describe("filterStudents", () => {
  const students = [
    mkStudent({ id: "A", name: "สมชาย", status: "กำลังศึกษา", scholarship: "ทุน 2 ปี", country: "ไทย" }),
    mkStudent({ id: "B", name: "สมหญิง", status: "ฝึกงาน",    scholarship: "ทุน 3 ปี", country: "ญี่ปุ่น",
      enrollments: [{ university: "Tokyo", year: "2", endDate: null }] }),
    mkStudent({ id: "C", name: "อรุณ",   status: "จบการศึกษา", scholarship: "ทุน 2 ปี", country: "ไทย" }),
  ];

  it("ไม่มี filter — คืนทั้งหมด", () => {
    expect(filterStudents(students, {})).toHaveLength(3);
  });

  it("filterStatus — กรองตามสถานะ", () => {
    const res = filterStudents(students, { filterStatus: "ฝึกงาน" });
    expect(res.map((s) => s.id)).toEqual(["B"]);
  });

  it("filterCountry — กรองตามประเทศ", () => {
    const res = filterStudents(students, { filterCountry: "ญี่ปุ่น" });
    expect(res.map((s) => s.id)).toEqual(["B"]);
  });

  it("filterScholarship — กรองตามทุน", () => {
    const res = filterStudents(students, { filterScholarship: "ทุน 3 ปี" });
    expect(res.map((s) => s.id)).toEqual(["B"]);
  });

  it("filterUniversity — กรองตามสถาบันปัจจุบัน", () => {
    const res = filterStudents(students, { filterUniversity: "Tokyo" });
    expect(res.map((s) => s.id)).toEqual(["B"]);
  });

  it("keywords — AND filter หลาย keyword", () => {
    // "สมชาย" AND "kmutt" → เจอแค่ A
    const res = filterStudents(students, { keywords: ["สมชาย", "kmutt"] });
    expect(res.map((s) => s.id)).toEqual(["A"]);
  });

  it("searchInput — live search", () => {
    const res = filterStudents(students, { searchInput: "อรุณ" });
    expect(res.map((s) => s.id)).toEqual(["C"]);
  });

  it("หลาย filter รวมกัน — AND logic", () => {
    const res = filterStudents(students, {
      filterStatus: "กำลังศึกษา",
      filterScholarship: "ทุน 2 ปี",
    });
    expect(res.map((s) => s.id)).toEqual(["A"]);
  });

  it("ไม่มีรายการที่ตรง — คืน array ว่าง", () => {
    const res = filterStudents(students, { filterStatus: "พักการเรียน" });
    expect(res).toHaveLength(0);
  });

  it("sortBy newest — เรียงตาม createdAt", () => {
    const sWithDates = [
      mkStudent({ id: "X", createdAt: "2024-01-01T00:00:00.000Z" }),
      mkStudent({ id: "Y", createdAt: "2024-06-01T00:00:00.000Z" }),
    ];
    const res = filterStudents(sWithDates, { sortBy: "newest" });
    expect(res[0].id).toBe("Y");
  });
});
