"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import { useStudents } from "@/components/admin/contexts/StudentContext";

// ── Constants ─────────────────────────────────────────────────
const PREFIXES = ["นาย", "นางสาว", "นาง"];
const PREFIXES_EN = ["Mr.", "Miss", "Mrs."];
const STATUSES = ["กำลังศึกษา", "ฝึกงาน", "จบการศึกษา", "พักการเรียน", "พ้นสภาพ"];
const SCHOLARSHIPS = ["ทุน 2 ปี", "ทุน 3 ปี", "ทุน 5 ปี", "ทุน จภ."];
const MILITARY_STATUSES = ["ยังไม่ถึงเกณฑ์", "ผ่อนผัน", "ผ่านการเกณฑ์", "ได้รับการยกเว้น", "-"];
const UNIVERSITIES = [
    "KOSEN-KMUTT", "KOSEN-KMITL", "KOSEN-Chulabhorn",
    "Tokyo Institute of Technology (TITECH)", "University of Tokyo (UTokyo)",
    "Waseda University", "Keio University", "Osaka University",
    "Kyoto University", "Tohoku University", "Nagoya University",
    "Tokyo University of Science", "Hokkaido University",
];
const THAI_PROVINCES = [
    "กรุงเทพมหานคร","กระบี่","กาญจนบุรี","กาฬสินธุ์","กำแพงเพชร","ขอนแก่น","จันทบุรี","ฉะเชิงเทรา",
    "ชลบุรี","ชัยนาท","ชัยภูมิ","ชุมพร","เชียงราย","เชียงใหม่","ตรัง","ตราด","ตาก","นครนายก",
    "นครปฐม","นครพนม","นครราชสีมา","นครศรีธรรมราช","นครสวรรค์","นนทบุรี","นราธิวาส","น่าน",
    "บึงกาฬ","บุรีรัมย์","ปทุมธานี","ประจวบคีรีขันธ์","ปราจีนบุรี","ปัตตานี","พระนครศรีอยุธยา",
    "พะเยา","พังงา","พัทลุง","พิจิตร","พิษณุโลก","เพชรบุรี","เพชรบูรณ์","แพร่","ภูเก็ต",
    "มหาสารคาม","มุกดาหาร","แม่ฮ่องสอน","ยโสธร","ยะลา","ร้อยเอ็ด","ระนอง","ระยอง","ราชบุรี",
    "ลพบุรี","ลำปาง","ลำพูน","เลย","ศรีสะเกษ","สกลนคร","สงขลา","สตูล","สมุทรปราการ",
    "สมุทรสงคราม","สมุทรสาคร","สระแก้ว","สระบุรี","สิงห์บุรี","สุโขทัย","สุพรรณบุรี","สุราษฎร์ธานี",
    "สุรินทร์","หนองคาย","หนองบัวลำภู","อ่างทอง","อำนาจเจริญ","อุดรธานี","อุตรดิตถ์","อุทัยธานี","อุบลราชธานี",
];
const JP_PREFECTURES = [
    "Hokkaido","Aomori","Iwate","Miyagi","Akita","Yamagata","Fukushima",
    "Ibaraki","Tochigi","Gunma","Saitama","Chiba","Tokyo","Kanagawa",
    "Niigata","Toyama","Ishikawa","Fukui","Yamanashi","Nagano",
    "Gifu","Shizuoka","Aichi","Mie","Shiga","Kyoto","Osaka","Hyogo","Nara","Wakayama",
    "Tottori","Shimane","Okayama","Hiroshima","Yamaguchi",
    "Tokushima","Kagawa","Ehime","Kochi",
    "Fukuoka","Saga","Nagasaki","Kumamoto","Oita","Miyazaki","Kagoshima","Okinawa",
];

const EMPTY_ENROLLMENT = { university: "", studentId: "", univEmail: "", faculty: "", department: "", major: "", year: "", advisor: "", project: "" };
const EMPTY_ADDRESS_TH = { houseNo: "", subdistrict: "", district: "", province: "", postalCode: "" };
const EMPTY_ADDRESS_JP = { postalCode: "", prefecture: "", city: "", streetAddress: "", building: "" };

// ── Shared UI ─────────────────────────────────────────────────
function Field({ label, required, hint, hintError, children }) {
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-medium text-foreground">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {hint && <p className={`text-xs ${hintError ? "text-red-500 font-medium" : "text-muted"}`}>{hint}</p>}
        </div>
    );
}

function Section({ icon, title, description, children }) {
    return (
        <div className="card p-0 overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border px-5 py-3.5 bg-surface-muted">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-sm">{icon}</span>
                <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    {description && <p className="text-xs text-muted">{description}</p>}
                </div>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

const inputCls = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const selectCls = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft";

// ── Address sub-forms ─────────────────────────────────────────
function AddressEditTH({ value, onChange }) {
    const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });
    return (
        <div className="rounded-xl border border-border border-l-4 border-l-emerald-500 overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface-muted/50">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">🇹🇭 ที่อยู่ในประเทศไทย</p>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <Field label="บ้านเลขที่ / ซอย / ถนน">
                        <input type="text" value={value.houseNo} onChange={set("houseNo")} placeholder="123/4 ซอย 5 ถนนสุขุมวิท" className={inputCls} />
                    </Field>
                </div>
                <Field label="แขวง / ตำบล">
                    <input type="text" value={value.subdistrict} onChange={set("subdistrict")} placeholder="คลองเตย" className={inputCls} />
                </Field>
                <Field label="เขต / อำเภอ">
                    <input type="text" value={value.district} onChange={set("district")} placeholder="คลองเตย" className={inputCls} />
                </Field>
                <Field label="จังหวัด">
                    <select value={value.province} onChange={set("province")} className={selectCls}>
                        <option value="">-- เลือกจังหวัด --</option>
                        {THAI_PROVINCES.map(p => <option key={p}>{p}</option>)}
                    </select>
                </Field>
                <Field label="รหัสไปรษณีย์">
                    <input type="text" value={value.postalCode} onChange={set("postalCode")} placeholder="10110" className={inputCls} maxLength={5} />
                </Field>
            </div>
        </div>
    );
}

function AddressEditJP({ value, onChange }) {
    const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });
    return (
        <div className="rounded-xl border border-border border-l-4 border-l-rose-400 overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface-muted/50">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">🇯🇵 ที่อยู่ในญี่ปุ่น</p>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
                <Field label="รหัสไปรษณีย์">
                    <input type="text" value={value.postalCode} onChange={set("postalCode")} placeholder="150-0002" className={inputCls} />
                </Field>
                <Field label="จังหวัด (Prefecture)">
                    <select value={value.prefecture} onChange={set("prefecture")} className={selectCls}>
                        <option value="">-- เลือกจังหวัด --</option>
                        {JP_PREFECTURES.map(p => <option key={p}>{p}</option>)}
                    </select>
                </Field>
                <Field label="เมือง / เขต (City / Ward)">
                    <input type="text" value={value.city} onChange={set("city")} placeholder="Shibuya-ku" className={inputCls} />
                </Field>
                <Field label="ที่อยู่ (Street Address)">
                    <input type="text" value={value.streetAddress} onChange={set("streetAddress")} placeholder="4-5-6 Shibuya" className={inputCls} />
                </Field>
                <div className="sm:col-span-2">
                    <Field label="อาคาร / ห้อง (Building / Room)">
                        <input type="text" value={value.building} onChange={set("building")} placeholder="Shibuya Tower 301" className={inputCls} />
                    </Field>
                </div>
            </div>
        </div>
    );
}

// ── Empty form factory ────────────────────────────────────────
const emptyForm = () => ({
    prefix: "นาย",
    prefixEn: "Mr.",
    name: "",
    lastname: "",
    nameEn: "",
    lastnameEn: "",
    nickname: "",
    gender: "ชาย",
    dob: "",
    nationalId: "",
    passport: "",
    militaryStatus: "-",
    country: "ไทย",
    tel: "",
    email: "",
    lineId: "",
    prevSchool: "",
    scholarship: "",
    status: "กำลังศึกษา",
    note: "",
    enrollments: [{ ...EMPTY_ENROLLMENT }],
    addresses: { th: { ...EMPTY_ADDRESS_TH }, jp: { ...EMPTY_ADDRESS_JP } },
});

// ── Page ──────────────────────────────────────────────────────
export default function AddStudentPage() {
    const { addStudent } = useStudents();
    const router = useRouter();

    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [savedId, setSavedId] = useState("");

    const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

    const setEnrollment = (key) => (e) =>
        setForm((prev) => ({
            ...prev,
            enrollments: [{ ...prev.enrollments[0], [key]: e.target.value }],
        }));

    const setAddressTH = (updated) =>
        setForm((prev) => ({ ...prev, addresses: { ...prev.addresses, th: updated } }));

    const setAddressJP = (updated) =>
        setForm((prev) => ({ ...prev, addresses: { ...prev.addresses, jp: updated } }));

    const enr = form.enrollments[0];

    const isValid =
        form.name.trim() && form.lastname.trim() &&
        enr.university.trim() && form.tel.trim() && form.email.trim();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValid) return;
        setSaving(true);
        await new Promise((r) => setTimeout(r, 600));
        const newId = addStudent({ ...form, university: enr.university });
        setSaving(false);
        setSavedId(newId);
        setSaved(true);
    };

    const handleReset = () => {
        setSaved(false);
        setForm(emptyForm());
    };

    if (saved) {
        return (
            <>
                <AdminTopBar title="เพิ่มนักเรียนสำเร็จ" />
                <div className="flex flex-col items-center gap-4 py-24 text-center p-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-lg font-bold text-foreground">เพิ่มนักเรียนสำเร็จ!</p>
                        <p className="mt-1 text-sm text-muted">
                            {form.prefix}{form.name} {form.lastname} ถูกเพิ่มเข้าระบบแล้ว
                        </p>
                    </div>
                    <div className="mt-2 flex gap-3">
                        <Link href={`/admin/students/${savedId}`} className="btn-primary">
                            ดูข้อมูลนักเรียน
                        </Link>
                        <button onClick={handleReset}
                            className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
                            เพิ่มนักเรียนคนต่อไป
                        </button>
                        <Link href="/admin/students/list"
                            className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
                            กลับรายการ
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <AdminTopBar
                title="เพิ่มนักเรียนใหม่"
                description="กรอกข้อมูลให้ครบถ้วนเพื่อสร้างบัญชีนักเรียนในระบบ"
            />

            <div className="p-6">
                <Link href="/admin/students/list"
                    className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    กลับไปรายการนักเรียน
                </Link>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* ── Row 1: สถานะ + ข้อมูลส่วนตัว ── */}
                    <div className="grid gap-5 xl:grid-cols-[320px_1fr]">

                        {/* สถานะและระบบ */}
                        <Section icon="🪪" title="สถานะและระบบ" description="สถานะและทุนการศึกษา">
                            <div className="space-y-4">
                                <Field label="สถานะ" required>
                                    <select value={form.status} onChange={set("status")} className={selectCls}>
                                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                                    </select>
                                </Field>
                                <Field label="ทุนการศึกษา">
                                    <select value={form.scholarship} onChange={set("scholarship")} className={selectCls}>
                                        <option value="">-- ไม่ระบุ --</option>
                                        {SCHOLARSHIPS.map((s) => <option key={s}>{s}</option>)}
                                    </select>
                                </Field>
                            </div>
                        </Section>

                        {/* ข้อมูลส่วนตัว */}
                        <Section icon="👤" title="ข้อมูลส่วนตัว" description="ชื่อ-นามสกุล วันเกิด และข้อมูลประจำตัว">
                            <div className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <Field label="คำนำหน้า (ไทย)" required>
                                        <select value={form.prefix} onChange={(e) => {
                                            const i = PREFIXES.indexOf(e.target.value);
                                            setForm((prev) => ({
                                                ...prev,
                                                prefix: e.target.value,
                                                prefixEn: PREFIXES_EN[i] ?? prev.prefixEn,
                                                gender: e.target.value === "นาย" ? "ชาย" : "หญิง",
                                            }));
                                        }} className={selectCls}>
                                            {PREFIXES.map((p) => <option key={p}>{p}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="ชื่อ (ไทย)" required>
                                        <input type="text" value={form.name} onChange={set("name")} placeholder="สมชาย" className={inputCls} />
                                    </Field>
                                    <Field label="นามสกุล (ไทย)" required>
                                        <input type="text" value={form.lastname} onChange={set("lastname")} placeholder="ประเสริฐ" className={inputCls} />
                                    </Field>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <Field label="คำนำหน้า (EN)">
                                        <input type="text" value={form.prefixEn} onChange={set("prefixEn")} placeholder="Mr." className={inputCls} />
                                    </Field>
                                    <Field label="First Name (EN)">
                                        <input type="text" value={form.nameEn} onChange={set("nameEn")} placeholder="Somchai" className={inputCls} />
                                    </Field>
                                    <Field label="Last Name (EN)">
                                        <input type="text" value={form.lastnameEn} onChange={set("lastnameEn")} placeholder="Prasert" className={inputCls} />
                                    </Field>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <Field label="ชื่อเล่น">
                                        <input type="text" value={form.nickname} onChange={set("nickname")} placeholder="ชาย" className={inputCls} />
                                    </Field>
                                    <Field label="เพศ">
                                        <select value={form.gender} onChange={set("gender")} className={selectCls}>
                                            <option value="ชาย">ชาย</option>
                                            <option value="หญิง">หญิง</option>
                                        </select>
                                    </Field>
                                    <Field label="วันเกิด">
                                        <input type="date" value={form.dob} onChange={set("dob")} className={inputCls} />
                                    </Field>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <Field label="เลขบัตรประชาชน" hint="13 หลัก">
                                        <input type="text" value={form.nationalId} onChange={set("nationalId")} placeholder="1-2345-67890-12-3" className={inputCls} />
                                    </Field>
                                    <Field label="เลข Passport">
                                        <input type="text" value={form.passport} onChange={set("passport")} placeholder="AB1234567" className={inputCls} />
                                    </Field>
                                    <Field label="สถานะเกณฑ์ทหาร" hint="เฉพาะเพศชาย">
                                        <select value={form.militaryStatus} onChange={set("militaryStatus")} className={selectCls}>
                                            {MILITARY_STATUSES.map((m) => <option key={m}>{m}</option>)}
                                        </select>
                                    </Field>
                                </div>
                            </div>
                        </Section>
                    </div>

                    {/* ── Row 2: ที่อยู่ + การศึกษา ── */}
                    <div className="grid gap-5 xl:grid-cols-2">

                        {/* ที่อยู่และการติดต่อ */}
                        <Section icon="📍" title="ที่อยู่และการติดต่อ">
                            <div className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="เบอร์โทรศัพท์" required hint="เช่น 081-234-5678">
                                        <input type="tel" value={form.tel} onChange={set("tel")} placeholder="081-234-5678" className={inputCls} />
                                    </Field>
                                    <Field label="อีเมล" required>
                                        <input type="email" value={form.email} onChange={set("email")} placeholder="student@kosen.ac.th" className={inputCls} />
                                    </Field>
                                    <Field label="LINE ID">
                                        <input type="text" value={form.lineId} onChange={set("lineId")} placeholder="student_line" className={inputCls} />
                                    </Field>
                                    <Field label="ประเทศที่พำนักปัจจุบัน">
                                        <select value={form.country} onChange={set("country")} className={selectCls}>
                                            <option value="">ไม่ระบุ</option>
                                            <option value="ไทย">🇹🇭 ไทย</option>
                                            <option value="ญี่ปุ่น">🇯🇵 ญี่ปุ่น</option>
                                        </select>
                                    </Field>
                                </div>
                                <AddressEditTH
                                    value={form.addresses.th}
                                    onChange={setAddressTH}
                                />
                                <AddressEditJP
                                    value={form.addresses.jp}
                                    onChange={setAddressJP}
                                />
                            </div>
                        </Section>

                        {/* ข้อมูลการศึกษา */}
                        <Section icon="🏫" title="ข้อมูลการศึกษา" description="ประวัติและสถาบันการศึกษา">
                            <div className="space-y-4">
                                <Field label="โรงเรียนเดิม">
                                    <input type="text" value={form.prevSchool} onChange={set("prevSchool")} placeholder="โรงเรียนมหิดลวิทยานุสรณ์" className={inputCls} />
                                </Field>

                                <div className="border-t border-border pt-4 space-y-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">การศึกษาปัจจุบัน</p>

                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <Field label="มหาวิทยาลัย" required>
                                            <input
                                                type="text"
                                                list="uni-list"
                                                value={enr.university}
                                                onChange={setEnrollment("university")}
                                                placeholder="ชื่อมหาวิทยาลัย..."
                                                className={inputCls}
                                            />
                                            <datalist id="uni-list">
                                                {UNIVERSITIES.map(u => <option key={u} value={u} />)}
                                            </datalist>
                                        </Field>
                                        <Field label="รหัสนักศึกษา (สถาบันนี้)">
                                            <input type="text" value={enr.studentId} onChange={setEnrollment("studentId")} placeholder="64XXXXXXX" className={inputCls} />
                                        </Field>
                                        <Field label="อีเมล (สถาบัน)">
                                            <input type="email" value={enr.univEmail} onChange={setEnrollment("univEmail")} placeholder="student@university.ac.th" className={inputCls} />
                                        </Field>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <Field label="คณะ">
                                            <input type="text" value={enr.faculty} onChange={setEnrollment("faculty")} placeholder="วิศวกรรมศาสตร์" className={inputCls} />
                                        </Field>
                                        <Field label="ภาควิชา">
                                            <input type="text" value={enr.department} onChange={setEnrollment("department")} placeholder="ภาควิชา..." className={inputCls} />
                                        </Field>
                                        <Field label="สาขาวิชา">
                                            <input type="text" value={enr.major} onChange={setEnrollment("major")} placeholder="สาขาวิชา..." className={inputCls} />
                                        </Field>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="ชั้นปี">
                                            <select value={enr.year} onChange={setEnrollment("year")} className={selectCls}>
                                                <option value="">-- เลือกชั้นปี --</option>
                                                {[1, 2, 3, 4, 5].map((y) => <option key={y} value={String(y)}>ปีที่ {y}</option>)}
                                            </select>
                                        </Field>
                                        <Field label="อาจารย์ที่ปรึกษา">
                                            <input type="text" value={enr.advisor} onChange={setEnrollment("advisor")} placeholder="รศ.ดร.ชื่อ นามสกุล" className={inputCls} />
                                        </Field>
                                    </div>

                                    <Field label="หัวข้อโปรเจกต์ / วิทยานิพนธ์" hint="กรอกเมื่อนักเรียนเริ่มทำโปรเจกต์ (ปี 3 ขึ้นไป)">
                                        <textarea value={enr.project} onChange={setEnrollment("project")} rows={2}
                                            placeholder="ระบุหัวข้อโปรเจกต์..."
                                            className={inputCls + " resize-none"} />
                                    </Field>
                                </div>
                            </div>
                        </Section>
                    </div>

                    {/* ── หมายเหตุ ── */}
                    <Section icon="📝" title="หมายเหตุ" description="ข้อมูลเพิ่มเติม (ไม่บังคับ)">
                        <textarea value={form.note} onChange={set("note")} rows={3}
                            placeholder="บันทึกเพิ่มเติม เช่น ความต้องการพิเศษ หรือข้อมูลอื่นๆ..."
                            className={inputCls + " resize-none"} />
                    </Section>

                    {/* ── Action buttons ── */}
                    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4">
                        <p className="text-xs text-muted">
                            <span className="text-red-500">*</span> จำเป็นต้องกรอก
                        </p>
                        <div className="flex items-center gap-3">
                            <Link href="/admin/students/list"
                                className="rounded-xl border border-border px-5 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
                                ยกเลิก
                            </Link>
                            <button type="submit" disabled={!isValid || saving}
                                className="btn-primary inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                                {saving ? (
                                    <>
                                        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        บันทึกข้อมูล
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                </form>
            </div>
        </>
    );
}
