"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import { useStudents } from "@/components/admin/contexts/StudentContext";
import { onlyThai, onlyThaiText, onlyEnglish, onlyEnglishAddress, onlyNumeric, onlyAscii, formatThaiPhone, formatThaiNationalId } from "@/lib/utils/inputFilters";

// ── Constants ─────────────────────────────────────────────────
// TH ↔ EN คำนำหน้า ผูกกันเป็นชุดเดียว — เลือกฝั่งไหนอีกฝั่งและเพศจะเซ็ตให้อัตโนมัติ
const PREFIX_OPTIONS = [
    { th: "นาย",      en: "Mr.",    gender: "ชาย" },
    { th: "นางสาว",   en: "Miss",   gender: "หญิง" },
    { th: "นาง",      en: "Mrs.",   gender: "หญิง" },
    { th: "เด็กชาย",  en: "Master", gender: "ชาย" },
    { th: "เด็กหญิง", en: "Miss",   gender: "หญิง" },
];
const PREFIXES = PREFIX_OPTIONS.map((p) => p.th);
const PREFIXES_EN = PREFIX_OPTIONS.map((p) => p.en);

// หา index ของ PREFIX_OPTIONS ที่ตรงกับค่าปัจจุบัน — ใช้ th+en คู่กันเพราะ "Miss"
// ซ้ำกันได้ทั้งนางสาวและเด็กหญิง (ไม่มีคำ EN แยกที่ใช้กันทั่วไปสำหรับเด็กหญิง)
function findPrefixIndex(prefix, prefixEn) {
    const byBoth = PREFIX_OPTIONS.findIndex((o) => o.th === prefix && o.en === prefixEn);
    if (byBoth !== -1) return byBoth;
    return PREFIX_OPTIONS.findIndex((o) => o.th === prefix);
}
const STATUSES = ["กำลังศึกษา", "ฝึกงาน", "จบการศึกษา", "พักการเรียน", "พ้นสภาพ"];
const SCHOLARSHIPS = ["ทุน 2 ปี", "ทุน 3 ปี", "ทุน 5 ปี", "ทุน จภ."];
const SCHOLARSHIP_LABEL = {
    "ทุน 2 ปี": "ทุน 2 ปี (advance course)",
    "ทุน 3 ปี": "ทุน 3 ปี (transfer)",
};
const scholarshipLabel = (val) => SCHOLARSHIP_LABEL[val] ?? val;
const MAX_ENROLLMENTS = 4;
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

const EMPTY_ENROLLMENT = { university: "", studentId: "", univEmail: "", faculty: "", department: "", major: "", year: "", advisor: "", project: "", startDate: "", endDate: "" };
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

// <input type="date"> ต้องการ format YYYY-MM-DD เป๊ะๆ — กันไว้เผื่อค่าที่มาจากที่อื่น
// ไม่ใช่ string ว่างเปล่า (เช่น โคลนข้อมูลจากนักเรียนคนอื่น)
function toDateInputValue(v) {
    if (!v) return "";
    return String(v).slice(0, 10);
}

// ── Address sub-forms ─────────────────────────────────────────
function AddressEditTH({ value, onChange }) {
    const setT = (key, sanitize) => (e) => onChange({ ...value, [key]: sanitize(e.target.value) });
    return (
        <div className="rounded-xl border border-border border-l-4 border-l-emerald-500 overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface-muted/50">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">🇹🇭 ที่อยู่ในประเทศไทย</p>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <Field label="บ้านเลขที่ / ซอย / ถนน">
                        <input type="text" value={value.houseNo} onChange={setT("houseNo", onlyThaiText)} placeholder="123/4 ซอย 5 ถนนสุขุมวิท" className={inputCls} />
                    </Field>
                </div>
                <Field label="แขวง / ตำบล">
                    <input type="text" value={value.subdistrict} onChange={setT("subdistrict", onlyThai)} placeholder="คลองเตย" className={inputCls} />
                </Field>
                <Field label="เขต / อำเภอ">
                    <input type="text" value={value.district} onChange={setT("district", onlyThai)} placeholder="คลองเตย" className={inputCls} />
                </Field>
                <Field label="จังหวัด">
                    <select value={value.province} onChange={(e) => onChange({ ...value, province: e.target.value })} className={selectCls}>
                        <option value="">-- เลือกจังหวัด --</option>
                        {THAI_PROVINCES.map(p => <option key={p}>{p}</option>)}
                    </select>
                </Field>
                <Field label="รหัสไปรษณีย์">
                    <input type="text" value={value.postalCode} onChange={setT("postalCode", onlyNumeric)} placeholder="10110" className={inputCls} maxLength={5} inputMode="numeric" />
                </Field>
            </div>
        </div>
    );
}

function AddressEditJP({ value, onChange }) {
    const setT = (key, sanitize) => (e) => onChange({ ...value, [key]: sanitize(e.target.value) });
    return (
        <div className="rounded-xl border border-border border-l-4 border-l-rose-400 overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface-muted/50">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">🇯🇵 ที่อยู่ในญี่ปุ่น</p>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
                <Field label="รหัสไปรษณีย์">
                    <input type="text" value={value.postalCode} onChange={setT("postalCode", onlyNumeric)} placeholder="150-0002" className={inputCls} inputMode="numeric" />
                </Field>
                <Field label="จังหวัด (Prefecture)">
                    <select value={value.prefecture} onChange={(e) => onChange({ ...value, prefecture: e.target.value })} className={selectCls}>
                        <option value="">-- เลือกจังหวัด --</option>
                        {JP_PREFECTURES.map(p => <option key={p}>{p}</option>)}
                    </select>
                </Field>
                <Field label="เมือง / เขต (City / Ward)">
                    <input type="text" value={value.city} onChange={setT("city", onlyEnglishAddress)} placeholder="Shibuya-ku" className={inputCls} />
                </Field>
                <Field label="ที่อยู่ (Street Address)">
                    <input type="text" value={value.streetAddress} onChange={setT("streetAddress", onlyEnglishAddress)} placeholder="4-5-6 Shibuya" className={inputCls} />
                </Field>
                <div className="sm:col-span-2">
                    <Field label="อาคาร / ห้อง (Building / Room)">
                        <input type="text" value={value.building} onChange={setT("building", onlyEnglishAddress)} placeholder="Shibuya Tower 301" className={inputCls} />
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
    selfFunded: false,
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

    const set  = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
    const setT = (key, sanitize) => (e) => setForm((prev) => ({ ...prev, [key]: sanitize(e.target.value) }));

    const setEnrollment = (idx, key) => (e) =>
        setForm((prev) => ({
            ...prev,
            enrollments: prev.enrollments.map((enr, i) => i === idx ? { ...enr, [key]: e.target.value } : enr),
        }));

    const setEnrollmentT = (idx, key, sanitize) => (e) =>
        setForm((prev) => ({
            ...prev,
            enrollments: prev.enrollments.map((enr, i) => i === idx ? { ...enr, [key]: sanitize(e.target.value) } : enr),
        }));

    const addEnrollment = () =>
        setForm((prev) => ({
            ...prev,
            enrollments: [...prev.enrollments, { ...EMPTY_ENROLLMENT }],
        }));

    const removeEnrollment = (idx) =>
        setForm((prev) => ({
            ...prev,
            enrollments: prev.enrollments.filter((_, i) => i !== idx),
        }));

    const setAddressTH = (updated) =>
        setForm((prev) => ({ ...prev, addresses: { ...prev.addresses, th: updated } }));

    const setAddressJP = (updated) =>
        setForm((prev) => ({ ...prev, addresses: { ...prev.addresses, jp: updated } }));

    const isValid =
        form.name.trim() && form.lastname.trim() &&
        form.enrollments[0]?.university?.trim() && form.tel.trim() && form.email.trim();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValid) return;
        setSaving(true);
        await new Promise((r) => setTimeout(r, 600));
        const newId = addStudent({ ...form });
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
                                        {SCHOLARSHIPS.map((s) => <option key={s} value={s}>{scholarshipLabel(s)}</option>)}
                                    </select>
                                    <label className="mt-2 flex cursor-pointer items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={!!form.selfFunded}
                                            onChange={(e) => setForm((prev) => ({ ...prev, selfFunded: e.target.checked }))}
                                            className="h-3.5 w-3.5 rounded border-border accent-amber-500"
                                        />
                                        <span className={`text-xs ${form.selfFunded ? "font-semibold text-amber-700" : "text-muted"}`}>
                                            จ่ายค่าเรียนเอง
                                        </span>
                                        {form.selfFunded && (
                                            <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                                💰
                                            </span>
                                        )}
                                    </label>
                                </Field>
                            </div>
                        </Section>

                        {/* ข้อมูลส่วนตัว */}
                        <Section icon="👤" title="ข้อมูลส่วนตัว" description="ชื่อ-นามสกุล วันเกิด และข้อมูลประจำตัว">
                            <div className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <Field label="คำนำหน้า (ไทย)" required>
                                        <select value={form.prefix} onChange={(e) => {
                                            const opt = PREFIX_OPTIONS.find((o) => o.th === e.target.value);
                                            setForm((prev) => ({
                                                ...prev,
                                                prefix: e.target.value,
                                                prefixEn: opt?.en ?? prev.prefixEn,
                                                gender: opt?.gender ?? prev.gender,
                                            }));
                                        }} className={selectCls}>
                                            {PREFIXES.map((p) => <option key={p}>{p}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="ชื่อ (ไทย)" required>
                                        <input type="text" value={form.name} onChange={setT("name", onlyThai)} placeholder="สมชาย" className={inputCls} />
                                    </Field>
                                    <Field label="นามสกุล (ไทย)" required>
                                        <input type="text" value={form.lastname} onChange={setT("lastname", onlyThai)} placeholder="ประเสริฐ" className={inputCls} />
                                    </Field>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <Field label="คำนำหน้า (EN)">
                                        <select
                                            value={String(findPrefixIndex(form.prefix, form.prefixEn))}
                                            onChange={(e) => {
                                                const opt = PREFIX_OPTIONS[Number(e.target.value)];
                                                if (!opt) return;
                                                setForm((prev) => ({ ...prev, prefix: opt.th, prefixEn: opt.en, gender: opt.gender }));
                                            }}
                                            className={selectCls}
                                        >
                                            {PREFIX_OPTIONS.map((o, i) => (
                                                <option key={i} value={i}>{o.en}{o.th.startsWith("เด็ก") ? ` (${o.th})` : ""}</option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="First Name (EN)">
                                        <input type="text" value={form.nameEn} onChange={setT("nameEn", onlyEnglish)} placeholder="Somchai" className={inputCls} />
                                    </Field>
                                    <Field label="Last Name (EN)">
                                        <input type="text" value={form.lastnameEn} onChange={setT("lastnameEn", onlyEnglish)} placeholder="Prasert" className={inputCls} />
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
                                        <input type="date" value={toDateInputValue(form.dob)} onChange={set("dob")} className={inputCls} />
                                    </Field>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <Field label="เลขบัตรประชาชน" hint="13 หลัก">
                                        <input type="text" value={form.nationalId} onChange={setT("nationalId", formatThaiNationalId)} placeholder="1-2345-67890-12-3" maxLength={17} className={inputCls} inputMode="numeric" />
                                    </Field>
                                    <Field label="เลข Passport">
                                        <input type="text" value={form.passport} onChange={setT("passport", onlyAscii)} placeholder="AB1234567" className={inputCls} />
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
                                        <input type="tel" value={form.tel} onChange={setT("tel", formatThaiPhone)} placeholder="081-234-5678" maxLength={12} className={inputCls} inputMode="numeric" />
                                    </Field>
                                    <Field label="อีเมล" required>
                                        <input type="email" value={form.email} onChange={setT("email", onlyAscii)} placeholder="student@kosen.ac.th" className={inputCls} />
                                    </Field>
                                    <Field label="LINE ID">
                                        <input type="text" value={form.lineId} onChange={setT("lineId", onlyAscii)} placeholder="student_line" className={inputCls} />
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
                                    <input type="text" value={form.prevSchool} onChange={setT("prevSchool", onlyThaiText)} placeholder="โรงเรียนมหิดลวิทยานุสรณ์" className={inputCls} />
                                </Field>

                                <div className="border-t border-border pt-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">สถาบันการศึกษา</p>
                                        <span className="text-xs text-muted">{form.enrollments.length}/{MAX_ENROLLMENTS}</span>
                                    </div>

                                    {form.enrollments.map((enr, idx) => (
                                        <div key={idx} className="rounded-xl border border-border overflow-hidden">
                                            <div className="flex items-center justify-between border-b border-border bg-surface-muted/50 px-4 py-2.5">
                                                <p className="text-xs font-semibold text-foreground">
                                                    สถาบัน {idx + 1}
                                                    {idx === 0 && <span className="ml-1.5 text-[10px] font-normal text-muted">(หลัก)</span>}
                                                </p>
                                                {idx > 0 && (
                                                    <button type="button" onClick={() => removeEnrollment(idx)}
                                                        className="text-xs text-red-500 hover:text-red-700 transition-colors">
                                                        ลบ
                                                    </button>
                                                )}
                                            </div>
                                            <div className="space-y-4 p-4">
                                                <div className="grid gap-4 sm:grid-cols-3">
                                                    <Field label="มหาวิทยาลัย" required={idx === 0}>
                                                        <input type="text" list={`uni-list-${idx}`} value={enr.university}
                                                            onChange={setEnrollment(idx, "university")}
                                                            placeholder="ชื่อมหาวิทยาลัย..." className={inputCls} />
                                                        <datalist id={`uni-list-${idx}`}>
                                                            {UNIVERSITIES.map(u => <option key={u} value={u} />)}
                                                        </datalist>
                                                    </Field>
                                                    <Field label="รหัสนักศึกษา (สถาบันนี้)">
                                                        <input type="text" value={enr.studentId} onChange={setEnrollmentT(idx, "studentId", onlyAscii)} placeholder="64XXXXXXX" className={inputCls} />
                                                    </Field>
                                                    <Field label="อีเมล (สถาบัน)">
                                                        <input type="email" value={enr.univEmail} onChange={setEnrollmentT(idx, "univEmail", onlyAscii)} placeholder="student@university.ac.th" className={inputCls} />
                                                    </Field>
                                                </div>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <Field label="วันที่เริ่มเรียน">
                                                        <input type="date" value={toDateInputValue(enr.startDate)} onChange={setEnrollment(idx, "startDate")} className={inputCls} />
                                                    </Field>
                                                    <Field label="วันที่จบ / ย้ายออก" hint="เว้นว่างไว้ถ้ายังเรียนอยู่สถาบันนี้">
                                                        <input type="date" value={toDateInputValue(enr.endDate)} onChange={setEnrollment(idx, "endDate")} className={inputCls} />
                                                    </Field>
                                                </div>
                                                <div className="grid gap-4 sm:grid-cols-3">
                                                    <Field label="คณะ">
                                                        <input type="text" value={enr.faculty} onChange={setEnrollment(idx, "faculty")} placeholder="วิศวกรรมศาสตร์" className={inputCls} />
                                                    </Field>
                                                    <Field label="ภาควิชา">
                                                        <input type="text" value={enr.department} onChange={setEnrollment(idx, "department")} placeholder="ภาควิชา..." className={inputCls} />
                                                    </Field>
                                                    <Field label="สาขาวิชา">
                                                        <input type="text" value={enr.major} onChange={setEnrollment(idx, "major")} placeholder="สาขาวิชา..." className={inputCls} />
                                                    </Field>
                                                </div>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <Field label="ชั้นปี">
                                                        <select value={enr.year} onChange={setEnrollment(idx, "year")} className={selectCls}>
                                                            <option value="">-- เลือกชั้นปี --</option>
                                                            {[1, 2, 3, 4, 5].map((y) => <option key={y} value={String(y)}>ปีที่ {y}</option>)}
                                                        </select>
                                                    </Field>
                                                    <Field label="อาจารย์ที่ปรึกษา">
                                                        <input type="text" value={enr.advisor} onChange={setEnrollment(idx, "advisor")} placeholder="รศ.ดร.ชื่อ นามสกุล" className={inputCls} />
                                                    </Field>
                                                </div>
                                                <Field label="หัวข้อโปรเจกต์ / วิทยานิพนธ์" hint="กรอกเมื่อนักเรียนเริ่มทำโปรเจกต์ (ปี 3 ขึ้นไป)">
                                                    <textarea value={enr.project} onChange={setEnrollment(idx, "project")} rows={2}
                                                        placeholder="ระบุหัวข้อโปรเจกต์..." className={inputCls + " resize-none"} />
                                                </Field>
                                            </div>
                                        </div>
                                    ))}

                                    {form.enrollments.length < MAX_ENROLLMENTS && (
                                        <button type="button" onClick={addEnrollment}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-sm text-muted hover:border-primary hover:text-primary transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                            + เพิ่มสถาบันการศึกษา
                                        </button>
                                    )}
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
