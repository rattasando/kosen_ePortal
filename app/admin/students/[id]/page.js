"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import { useStudents } from "@/components/admin/contexts/StudentContext";
import { useStudentHistory } from "@/components/admin/contexts/StudentHistoryContext";
import { diffSnapshot, buildSummary, formatHistoryDate } from "@/lib/utils/studentHistoryHelpers";
import { onlyThai, onlyThaiText, onlyEnglish, onlyEnglishAddress, onlyNumeric, onlyAscii, formatThaiPhone, formatThaiNationalId, formatThaiBankAccount } from "@/lib/utils/inputFilters";
import { DISTRICTS_BY_PROVINCE, SUBDISTRICTS_BY_DISTRICT } from "@/lib/data/thaiGeo";

// ── Constants ────────────────────────────────────────────────
// TH ↔ EN คำนำหน้า ผูกกันเป็นชุดเดียว — เลือกฝั่งไหนอีกฝั่งและเพศจะเซ็ตให้อัตโนมัติ
const PREFIX_OPTIONS = [
    { th: "นาย",      en: "Mr.",    gender: "ชาย" },
    { th: "นางสาว",   en: "Miss",   gender: "หญิง" },
    { th: "นาง",      en: "Mrs.",   gender: "หญิง" },
    { th: "เด็กชาย",  en: "Master", gender: "ชาย" },
    { th: "เด็กหญิง", en: "Miss",   gender: "หญิง" },
];
const PREFIXES    = PREFIX_OPTIONS.map((p) => p.th);
const PREFIXES_EN = PREFIX_OPTIONS.map((p) => p.en);

// หา index ของ PREFIX_OPTIONS ที่ตรงกับค่าปัจจุบัน — ใช้ th+en คู่กันเพราะ "Miss"
// ซ้ำกันได้ทั้งนางสาวและเด็กหญิง (ไม่มีคำ EN แยกที่ใช้กันทั่วไปสำหรับเด็กหญิง)
function findPrefixIndex(prefix, prefixEn) {
    const byBoth = PREFIX_OPTIONS.findIndex((o) => o.th === prefix && o.en === prefixEn);
    if (byBoth !== -1) return byBoth;
    return PREFIX_OPTIONS.findIndex((o) => o.th === prefix);
}
const STATUSES    = ["กำลังศึกษา", "ฝึกงาน", "จบการศึกษา", "พักการเรียน", "พ้นสภาพ"];
const UNIVERSITIES = [
  "KOSEN-KMUTT", "KOSEN-KMITL", "KOSEN-Chulabhorn",
  "Tokyo Institute of Technology (TITECH)", "University of Tokyo (UTokyo)",
  "Waseda University", "Keio University", "Osaka University",
  "Kyoto University", "Tohoku University", "Nagoya University",
  "Tokyo University of Science", "Hokkaido University",
];
const SCHOLARSHIPS    = ["ทุน 2 ปี", "ทุน 3 ปี", "ทุน 5 ปี", "ทุน จภ."];
const MILITARY_STATUSES = ["ยังไม่ถึงเกณฑ์", "ผ่อนผัน", "ผ่านการเกณฑ์", "ได้รับการยกเว้น", "-"];
const COUNTRIES = ["ไทย", "ญี่ปุ่น", "อื่นๆ"];

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

const EMPTY_ADDRESS_TH = { houseNo: "", subdistrict: "", district: "", province: "", postalCode: "" };
const EMPTY_ADDRESS_JP = { postalCode: "", prefecture: "", city: "", streetAddress: "", building: "" };

const STATUS_CONFIG = {
    กำลังศึกษา:  { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", ring: "ring-emerald-200" },
    ฝึกงาน:      { color: "bg-blue-100 text-blue-700 border-blue-200",           dot: "bg-blue-500",   ring: "ring-blue-200"    },
    จบการศึกษา:  { color: "bg-gray-100 text-gray-600 border-gray-200",           dot: "bg-gray-400",   ring: "ring-gray-200"    },
    พักการเรียน: { color: "bg-amber-100 text-amber-700 border-amber-200",        dot: "bg-amber-500",  ring: "ring-amber-200"   },
    พ้นสภาพ:     { color: "bg-red-100 text-red-700 border-red-200",              dot: "bg-red-500",    ring: "ring-red-200"     },
};
const SCHOLARSHIP_COLOR = {
    "ทุน 2 ปี": "bg-sky-50 text-sky-700 border-sky-200",
    "ทุน 3 ปี": "bg-teal-50 text-teal-700 border-teal-200",
    "ทุน 5 ปี": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "ทุน จภ.":  "bg-violet-50 text-violet-700 border-violet-200",
};
const SCHOLARSHIP_LABEL = {
    "ทุน 2 ปี": "ทุน 2 ปี (advance course)",
    "ทุน 3 ปี": "ทุน 3 ปี (transfer)",
};
const scholarshipLabel = (val) => SCHOLARSHIP_LABEL[val] ?? val;

const MAX_ENROLLMENTS = 4;
const EMPTY_ENROLLMENT = { university: "", studentId: "", univEmail: "", faculty: "", department: "", major: "", year: "", advisor: "", project: "", startDate: "", endDate: "" };

const inputCls  = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const selectCls = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft";
// read-only display — ใช้เมื่อ editing=false
const roInputCls  = "w-full rounded-xl border border-transparent bg-surface-muted/50 px-3 py-2 text-sm font-medium text-foreground outline-none cursor-default select-text";
const roSelectCls = "w-full rounded-xl border border-transparent bg-surface-muted/50 px-3 py-2 text-sm font-medium text-foreground outline-none cursor-default";

// ── Helpers ──────────────────────────────────────────────────
function formatDob(dob) {
    if (!dob) return "";
    const d = new Date(dob);
    if (isNaN(d)) return dob;
    return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}
function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}
// <input type="date"> ต้องการ format YYYY-MM-DD เป๊ะๆ แต่ API ส่งกลับมาเป็น
// ISO datetime เต็ม ("2005-05-13T00:00:00.000Z") — ต้องตัดให้เหลือแค่ส่วนวันที่
// ก่อนใส่ value ไม่งั้น browser จะมองว่าเป็นค่าไม่ถูกต้องแล้วโชว์ว่างเปล่า
function toDateInputValue(v) {
    if (!v) return "";
    return String(v).slice(0, 10);
}
function computeAge(dob) {
    if (!dob) return null;
    const birth = new Date(dob);
    if (isNaN(birth)) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

// Migrate old flat fields → new structured data
function migrateStudent(s) {
    let out = s;

    // Enrollments
    if (!Array.isArray(s.enrollments) || s.enrollments.length === 0) {
        out = {
            ...out,
            enrollments: [{
                university:  s.university  ?? "",
                studentId:   "",
                univEmail:   "",
                faculty:     s.faculty     ?? "",
                department:  s.department  ?? "",
                major:       s.major       ?? "",
                year:        s.year        ?? "",
                advisor:     s.advisor     ?? "",
                project:     s.project     ?? "",
                startDate:   "",
                endDate:     "",
            }],
        };
    }

    // Normalize travel date field names: DB ส่ง departureDateTh (lowercase) แต่ UI ใช้ TH (uppercase)
    // เก็บทั้งคู่ไว้กัน conflict — handleSave จะ normalize กลับก่อนส่ง API
    if (out.departureDateTh !== undefined && out.departureDateTH === undefined) {
        out = { ...out, departureDateTH: out.departureDateTh };
    }
    if (out.arrivalDateJp !== undefined && out.arrivalDateJP === undefined) {
        out = { ...out, arrivalDateJP: out.arrivalDateJp };
    }

    // Addresses — map flat DB fields (addrThHouseNo etc.) → nested UI structure
    // ไม่เขียนทับถ้ามี addresses อยู่แล้ว (กัน re-migrate ซ้ำ)
    if (!s.addresses) {
        out = {
            ...out,
            addresses: {
                th: {
                    houseNo:     s.addrThHouseNo     ?? "",
                    subdistrict: s.addrThSubdistrict ?? "",
                    district:    s.addrThDistrict    ?? "",
                    province:    s.addrThProvince    ?? "",
                    postalCode:  s.addrThPostalCode  ?? "",
                },
                jp: {
                    postalCode:    s.addrJpPostalCode    ?? "",
                    prefecture:    s.addrJpPrefecture    ?? "",
                    city:          s.addrJpCity          ?? "",
                    streetAddress: s.addrJpStreetAddress ?? "",
                    building:      s.addrJpBuilding      ?? "",
                },
            },
        };
    }

    return out;
}

// ── Shared UI ─────────────────────────────────────────────────

// Section card with icon header
function Section({ icon, title, description, children, action }) {
    return (
        <div className="card p-0 overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5 bg-surface-muted">
                <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-sm">{icon}</span>
                    <div>
                        <p className="text-sm font-semibold text-foreground">{title}</p>
                        {description && <p className="text-xs text-muted">{description}</p>}
                    </div>
                </div>
                {action}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

// View field: label on top, value below — for use in data grids
function Field({ label, value, mono, href, fullWidth, children }) {
    const content = children ?? (
        href
            ? <a href={href} className={`text-sm font-semibold text-primary hover:underline break-words ${mono ? "font-mono" : ""}`}>{value}</a>
            : <p className={`text-sm font-semibold text-foreground break-words ${mono ? "font-mono" : ""}`}>{value ?? "—"}</p>
    );
    if (!children && (value === null || value === undefined || value === "")) return null;
    return (
        <div className={fullWidth ? "col-span-2" : ""}>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
            {content}
        </div>
    );
}

// Edit mode field: label-above input
function EField({ label, required, hint, hintError, children }) {
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-medium text-foreground">
                {label}{required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {hint && <p className={`text-xs ${hintError ? "text-red-500 font-medium" : "text-muted"}`}>{hint}</p>}
        </div>
    );
}

function SubHeading({ label }) {
    return (
        <div className="col-span-2 flex items-center gap-2 pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
            <div className="flex-1 h-px bg-border" />
        </div>
    );
}

// ── Address view card ─────────────────────────────────────────
const ADDR_ACCENT = { th: "border-l-emerald-500", jp: "border-l-rose-400" };

function AddressViewCard({ flag, countryLabel, accentKey, fields }) {
    const filled = fields.filter((f) => f.value);
    if (!filled.length) return null;
    return (
        <div className={`rounded-xl border border-border border-l-4 ${ADDR_ACCENT[accentKey] ?? "border-l-border"} bg-surface-muted/30 overflow-hidden`}>
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-surface-muted/50">
                <span className="text-base leading-none">{flag}</span>
                <p className="text-sm font-bold text-foreground flex-1">{countryLabel}</p>
            </div>
            {/* Fields */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 p-4">
                {filled.map(({ label, value, fullWidth }) => (
                    <Field key={label} label={label} value={value} fullWidth={fullWidth} />
                ))}
            </div>
        </div>
    );
}

// ── Address edit section ──────────────────────────────────────
function AddressEditTH({ value, onChange, editing }) {
    const iCls = editing ? inputCls : roInputCls;
    const sCls = editing ? selectCls : roSelectCls;
    const setT = (key, sanitize) => (e) => onChange({ ...value, [key]: sanitize(e.target.value) });

    const districtList   = value.province ? (DISTRICTS_BY_PROVINCE[value.province]            ?? []) : [];
    const subdistrictList = value.district ? (SUBDISTRICTS_BY_DISTRICT[value.district]         ?? []) : [];

    return (
        <div className="rounded-xl border border-border p-4 space-y-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">🇹🇭 ที่อยู่ในประเทศไทย</p>
            <div className="grid gap-3 sm:grid-cols-2">
                <EField label="บ้านเลขที่ / ซอย / ถนน">
                    <input type="text" value={value.houseNo ?? ""} onChange={setT("houseNo", onlyThaiText)} readOnly={!editing}
                        className={iCls} />
                </EField>
                <EField label="จังหวัด">
                    <select value={value.province ?? ""} disabled={!editing} className={sCls}
                        onChange={(e) => onChange({ ...value, province: e.target.value, district: "", subdistrict: "" })}>
                        <option value="">— เลือกจังหวัด —</option>
                        {THAI_PROVINCES.map((p) => <option key={p}>{p}</option>)}
                    </select>
                </EField>
                <EField label="เขต / อำเภอ">
                    <input type="text" list="th-district-list" value={value.district ?? ""}
                        onChange={(e) => onChange({ ...value, district: e.target.value, subdistrict: "" })}
                        readOnly={!editing} className={iCls} />
                    {editing && districtList.length > 0 && (
                        <datalist id="th-district-list">
                            {districtList.map((d) => <option key={d} value={d} />)}
                        </datalist>
                    )}
                </EField>
                <EField label="แขวง / ตำบล">
                    {editing && subdistrictList.length > 0 ? (
                        <select value={value.subdistrict ?? ""} className={sCls}
                            onChange={(e) => onChange({ ...value, subdistrict: e.target.value })}>
                            <option value="">— เลือกแขวง / ตำบล —</option>
                            {subdistrictList.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    ) : (
                        <input type="text" value={value.subdistrict ?? ""}
                            onChange={setT("subdistrict", onlyThai)}
                            readOnly={!editing} className={iCls} />
                    )}
                </EField>
                <EField label="รหัสไปรษณีย์" hint={editing ? "5 หลัก" : undefined}>
                    <input type="text" value={value.postalCode ?? ""} onChange={setT("postalCode", onlyNumeric)} readOnly={!editing}
                        maxLength={5} className={iCls} inputMode="numeric" />
                </EField>
            </div>
        </div>
    );
}

function AddressEditJP({ value, onChange, editing }) {
    const iCls = editing ? inputCls : roInputCls;
    const sCls = editing ? selectCls : roSelectCls;
    const setT = (key, sanitize) => (e) => onChange({ ...value, [key]: sanitize(e.target.value) });
    return (
        <div className="rounded-xl border border-border p-4 space-y-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">🇯🇵 ที่อยู่ในญี่ปุ่น</p>
            <div className="grid gap-3 sm:grid-cols-2">
                <EField label="รหัสไปรษณีย์" hint={editing ? "เช่น 150-0002" : undefined}>
                    <input type="text" value={value.postalCode ?? ""} onChange={setT("postalCode", onlyNumeric)} readOnly={!editing}
                        className={iCls} inputMode="numeric" />
                </EField>
                <EField label="จังหวัด">
                    <select value={value.prefecture ?? ""} onChange={(e) => onChange({ ...value, prefecture: e.target.value })} disabled={!editing} className={sCls}>
                        <option value="">— เลือกจังหวัด —</option>
                        {JP_PREFECTURES.map((p) => <option key={p}>{p}</option>)}
                    </select>
                </EField>
                <EField label="เมือง / เขต" hint={editing ? "ภาษาอังกฤษ" : undefined}>
                    <input type="text" value={value.city ?? ""} onChange={setT("city", onlyEnglishAddress)} readOnly={!editing}
                        className={iCls} />
                </EField>
                <EField label="ที่อยู่" hint={editing ? "ภาษาอังกฤษ" : undefined}>
                    <input type="text" value={value.streetAddress ?? ""} onChange={setT("streetAddress", onlyEnglishAddress)} readOnly={!editing}
                        className={iCls} />
                </EField>
                <EField label="อาคาร / ห้อง" hint={editing ? "ถ้ามี" : undefined}>
                    <input type="text" value={value.building ?? ""} onChange={setT("building", onlyEnglishAddress)} readOnly={!editing}
                        className={iCls} />
                </EField>
            </div>
        </div>
    );
}

// ── Spinner ───────────────────────────────────────────────────
function Spinner() {
    return (
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
    );
}

// ── Delete Modal ─────────────────────────────────────────────
function DeleteModal({ name, id, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center px-6 pt-8 pb-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-foreground">ยืนยันการลบข้อมูล</h2>
                    <p className="mt-2 text-sm text-muted">คุณต้องการลบข้อมูลของ</p>
                    <p className="mt-1 font-semibold text-foreground">{name}</p>
                    <p className="text-xs text-muted">รหัส {id}</p>
                    <div className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
                        ⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้
                    </div>
                </div>
                <div className="flex gap-3 border-t border-border px-6 py-4">
                    <button onClick={onCancel} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-muted transition-colors">ยกเลิก</button>
                    <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors">ลบข้อมูล</button>
                </div>
            </div>
        </div>
    );
}

// ── Enrollment Timeline (view) ──────────────────────────────────
// ไล่เรียงสถาบันการศึกษาตามลำดับที่เรียนมา พร้อมช่วงวันที่เริ่ม-จบของแต่ละสถาบัน
// endDate ว่าง = สถาบันปัจจุบัน (ยังไม่จบ/ยังไม่ย้ายออก) — ดูคอมเมนต์ schema
const UNI_ACCENT = [
    "border-l-primary",
    "border-l-sky-500",
    "border-l-violet-500",
];

// แสดงสถาบันล่าสุดไว้บนสุด (เหมือนหน้า alumni ที่โชว์ที่ทำงานล่าสุดไว้บน) แม้ว่า
// ข้อมูลจริงในฐานข้อมูล/ฟอร์มแก้ไขจะเรียงตาม order จากน้อยไปมาก (เก่า→ใหม่) เหมือนเดิม
// เลข badge ยังนับตามลำดับเวลาจริง (สถาบันแรก = 1) ไม่ใช่ตามตำแหน่งที่แสดงผล
function EnrollmentTimeline({ enrollments }) {
    if (!enrollments.length) return null;
    const displayed = [...enrollments].reverse();
    return (
        <div className="relative">
            <div className="absolute left-3 top-0 h-full w-px bg-border" />
            <div className="space-y-4">
                {displayed.map((e, i) => (
                    <EnrollmentCard key={displayed.length - i} enrollment={e} label={displayed.length - i} />
                ))}
            </div>
        </div>
    );
}

function EnrollmentCard({ enrollment, label }) {
    const hasAcademic = enrollment.advisor || enrollment.project;
    const isCurrent = !enrollment.endDate;
    const hasDates = enrollment.startDate || enrollment.endDate;

    return (
        <div className="relative flex gap-3">
            {/* Timeline dot */}
            <span className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${isCurrent ? "bg-primary ring-4 ring-accent-soft" : "bg-muted"}`}>
                {label}
            </span>

            {/* Card */}
            <div className={`flex-1 rounded-xl border overflow-hidden ${isCurrent ? "border-l-4 border-l-primary border-primary/20 bg-accent-soft/30" : "border-l-4 border-l-border border-border bg-surface-muted/30"}`}>
                {/* Header */}
                <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border bg-surface-muted/50">
                    <p className="text-sm font-bold text-foreground flex-1">
                        {enrollment.university || <span className="text-muted italic font-normal">ไม่ระบุมหาวิทยาลัย</span>}
                    </p>
                    {isCurrent ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">● ปัจจุบัน</span>
                    ) : (
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">จบแล้ว</span>
                    )}
                    {enrollment.year && (
                        <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-muted border border-border">
                            ปีที่ {enrollment.year}
                        </span>
                    )}
                </div>

                {/* Date range */}
                {hasDates && (
                    <p className="flex items-center gap-1.5 px-4 pt-3 text-xs text-muted">
                        📅 {enrollment.startDate ? formatDate(enrollment.startDate) : "ไม่ระบุวันเริ่ม"}
                        <span>—</span>
                        {isCurrent ? "ปัจจุบัน" : formatDate(enrollment.endDate)}
                    </p>
                )}

                {/* Fields */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 p-4">
                    <Field label="รหัสนักเรียน (สถาบันนี้)" value={enrollment.studentId} mono />
                    <Field label="อีเมล (สถาบัน)"
                        value={enrollment.univEmail}
                        href={enrollment.univEmail ? `mailto:${enrollment.univEmail}` : undefined} />
                    <Field label="คณะ"      value={enrollment.faculty} />
                    <Field label="ภาควิชา"  value={enrollment.department} />
                    <Field label="สาขาวิชา" value={enrollment.major} />
                    {!hasAcademic && <div />}
                    {hasAcademic && <SubHeading label="งานวิชาการ" />}
                    {hasAcademic && <Field label="อาจารย์ที่ปรึกษา" value={enrollment.advisor} />}
                    {enrollment.project && <Field label="หัวข้อโปรเจกต์" value={enrollment.project} fullWidth />}
                </div>
            </div>
        </div>
    );
}

// ── Enrollment Edit Card ──────────────────────────────────────
function EnrollmentEditCard({ enrollment, index, total, onChange, onRemove, editing }) {
    const iCls = editing ? inputCls : roInputCls;
    const sCls = editing ? selectCls : roSelectCls;
    const set  = (key) => (e) => onChange({ ...enrollment, [key]: e.target.value });
    const setT = (key, sanitize) => (e) => onChange({ ...enrollment, [key]: sanitize(e.target.value) });
    return (
        <div className={`rounded-xl border border-border border-l-4 ${UNI_ACCENT[index] ?? "border-l-border"} overflow-hidden`}>
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 bg-surface-muted border-b border-border">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                    {index + 1}
                </span>
                <p className="flex-1 text-sm font-semibold text-foreground">
                    {enrollment.university || `สถาบันที่ ${index + 1}`}
                </p>
                {enrollment.endDate ? (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">จบแล้ว</span>
                ) : (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">● ปัจจุบัน</span>
                )}
                {editing && total > 1 && (
                    <button type="button" onClick={onRemove}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:border-red-400 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        ลบสถาบันนี้
                    </button>
                )}
            </div>

            {/* Fields */}
            <div className="space-y-4 p-4">
                {/* University + studentId + email */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <EField label="มหาวิทยาลัย" required={editing && index === 0}>
                        <input
                            type="text"
                            list={editing ? `uni-list-${index}` : undefined}
                            value={enrollment.university}
                            onChange={set("university")}
                            readOnly={!editing}
                            className={iCls}
                        />
                        {editing && <datalist id={`uni-list-${index}`}>
                            {UNIVERSITIES.map(u => <option key={u} value={u} />)}
                        </datalist>}
                    </EField>
                    <EField label="รหัสนักเรียน (สถาบันนี้)">
                        <input type="text" value={enrollment.studentId} onChange={setT("studentId", onlyAscii)} readOnly={!editing}
                            className={iCls} />
                    </EField>
                    <EField label="อีเมล (สถาบัน)" hint={editing ? "ไม่บังคับ" : undefined}>
                        <input type="email" value={enrollment.univEmail} onChange={setT("univEmail", onlyAscii)} readOnly={!editing}
                            className={iCls} />
                    </EField>
                </div>

                {/* วันที่เริ่ม/จบ */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <EField label="วันที่เริ่มเรียน">
                        <input type="date" value={toDateInputValue(enrollment.startDate)} onChange={set("startDate")} readOnly={!editing} className={iCls} />
                    </EField>
                    <EField label="วันที่จบ / ย้ายออก" hint={editing ? "เว้นว่างไว้ถ้ายังเรียนอยู่สถาบันนี้" : undefined}>
                        <input type="date" value={toDateInputValue(enrollment.endDate)} onChange={set("endDate")} readOnly={!editing} className={iCls} />
                    </EField>
                </div>

                {/* Faculty + dept + major */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <EField label="คณะ">
                        <input type="text" value={enrollment.faculty} onChange={set("faculty")} readOnly={!editing}
                            className={iCls} />
                    </EField>
                    <EField label="ภาควิชา">
                        <input type="text" value={enrollment.department} onChange={set("department")} readOnly={!editing}
                            className={iCls} />
                    </EField>
                    <EField label="สาขาวิชา">
                        <input type="text" value={enrollment.major} onChange={set("major")} readOnly={!editing}
                            className={iCls} />
                    </EField>
                </div>

                {/* Year + advisor */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <EField label="ชั้นปี">
                        <select value={enrollment.year} onChange={set("year")} disabled={!editing} className={sCls}>
                            <option value="">-- เลือกชั้นปี --</option>
                            {[1, 2, 3, 4, 5].map(y => <option key={y} value={String(y)}>ปีที่ {y}</option>)}
                        </select>
                    </EField>
                    <EField label="อาจารย์ที่ปรึกษา">
                        <input type="text" value={enrollment.advisor} onChange={set("advisor")} readOnly={!editing}
                            className={iCls} />
                    </EField>
                </div>

                {/* Project */}
                <EField label="หัวข้อโปรเจกต์ / วิทยานิพนธ์">
                    <textarea value={enrollment.project} onChange={set("project")} readOnly={!editing} rows={2}
                        className={iCls + " resize-none"} />
                </EField>
            </div>
        </div>
    );
}

// ── Profile Hero Card ─────────────────────────────────────────
function ProfileHeroCard({ d, editing }) {
    const statusCfg = STATUS_CONFIG[d.status] ?? { color: "bg-gray-100 text-gray-500 border-gray-200", dot: "bg-gray-400" };
    const initials  = (d.name ?? "?").charAt(0);

    return (
        <div className="card p-0 overflow-hidden">
            {/* Accent strip — amber เมื่ออยู่ใน edit mode */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${editing ? "from-amber-400 via-primary to-indigo-400" : "from-primary via-blue-400 to-indigo-400"}`} />

            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6">
                {/* Avatar */}
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-2xl font-extrabold text-primary ring-4 ring-accent-soft">
                    {initials}
                </div>

                {/* Identity */}
                <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-lg font-extrabold text-foreground leading-tight">
                            {d.prefix}{d.name} {d.lastname}
                        </h1>
                        {d.nickname && (
                            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted">"{d.nickname}"</span>
                        )}
                    </div>
                    {(d.nameEn || d.lastnameEn) && (
                        <p className="text-sm text-muted">
                            {[d.prefixEn, d.nameEn, d.lastnameEn].filter(Boolean).join(" ")}
                        </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {/* Status */}
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.color}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                            {d.status}
                        </span>
                        {/* Scholarship */}
                        {d.scholarship && (
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${SCHOLARSHIP_COLOR[d.scholarship] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                {scholarshipLabel(d.scholarship)}
                            </span>
                        )}
                        {/* Universities from enrollments */}
                        {(d.enrollments ?? []).filter(e => e.university).map((e, i) => (
                            <span key={i} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs text-muted">
                                🏫 {e.university}{e.year ? ` ปีที่ ${e.year}` : ""}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Edit Hero Card ────────────────────────────────────────────
function EditHeroCard({ form, setForm, student, isValid, saving, onCancel }) {
    const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
    const statusCfg = STATUS_CONFIG[form.status] ?? { color: "bg-gray-100 text-gray-500 border-gray-200", dot: "bg-gray-400" };

    return (
        <div className="card p-0 overflow-hidden ring-2 ring-primary/20">
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-primary to-indigo-400" />

            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:gap-6">
                {/* Avatar — live */}
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-2xl font-extrabold text-primary ring-4 ring-accent-soft">
                    {(form.name ?? "?").charAt(0)}
                </div>

                {/* Live name preview + status/id inputs */}
                <div className="flex-1 min-w-0 space-y-3">
                    {/* Live preview name */}
                    <div>
                        <p className="text-lg font-extrabold text-foreground leading-tight">
                            {form.prefix}{form.name || <span className="text-muted font-normal italic">ชื่อ</span>}{" "}
                            {form.lastname || <span className="text-muted font-normal italic">นามสกุล</span>}
                            {form.nickname ? <span className="ml-1.5 text-sm font-normal text-muted">"{form.nickname}"</span> : null}
                        </p>
                        {(form.nameEn || form.lastnameEn) && (
                            <p className="text-sm text-muted mt-0.5">
                                {[form.prefixEn, form.nameEn, form.lastnameEn].filter(Boolean).join(" ")}
                            </p>
                        )}
                        {(form.enrollments ?? []).filter(e => e.university).length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {form.enrollments.filter(e => e.university).map((e, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[11px] text-muted">
                                        🏫 {e.university}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Inline: Status · Scholarship */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">
                                สถานะ <span className="text-red-500">*</span>
                            </label>
                            <select value={form.status ?? ""} onChange={set("status")} className={selectCls}>
                                {STATUSES.map(s => <option key={s}>{s}</option>)}
                            </select>
                            <div className="mt-1.5 flex items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                                <span className="text-xs text-muted">{form.status}</span>
                            </div>
                        </div>
                        <div>
                            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">ทุนการศึกษา</label>
                            <select value={form.scholarship ?? ""} onChange={set("scholarship")} className={selectCls}>
                                <option value="">-- ไม่ระบุ --</option>
                                {SCHOLARSHIPS.map(s => <option key={s} value={s}>{scholarshipLabel(s)}</option>)}
                            </select>
                            {form.scholarship && (
                                <div className="mt-1.5">
                                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${SCHOLARSHIP_COLOR[form.scholarship] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                        {scholarshipLabel(form.scholarship)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 flex-row items-center gap-2">
                    <button type="button" onClick={onCancel}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        ยกเลิก
                    </button>
                    <button type="submit" disabled={!isValid || saving}
                        className="inline-flex items-center gap-1.5 rounded-xl btn-primary disabled:opacity-40 disabled:cursor-not-allowed text-sm px-3.5 py-2">
                        {saving ? <><Spinner />กำลังบันทึก...</> : <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            บันทึก
                        </>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── History Section ───────────────────────────────────────────
const EVENT_TYPE_CONFIG = {
    create: { label: "สร้างข้อมูล", pill: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    update: { label: "แก้ไขข้อมูล", pill: "bg-blue-100 text-blue-700 border-blue-200",          dot: "bg-blue-400" },
    delete: { label: "ลบข้อมูล",   pill: "bg-red-100 text-red-700 border-red-200",              dot: "bg-red-500" },
};

const SHOW_STEP = 5;

function HistorySection({ history }) {
    const [showAll, setShowAll] = useState(false);
    const displayed = showAll ? history : history.slice(0, SHOW_STEP);

    if (!history.length) {
        return (
            <Section icon="🕐" title="ประวัติการแก้ไข" description="บันทึกการเปลี่ยนแปลงข้อมูลทั้งหมด">
                <p className="text-sm text-muted">ยังไม่มีประวัติ — จะปรากฏหลังจากบันทึกการเปลี่ยนแปลงครั้งแรก</p>
            </Section>
        );
    }

    return (
        <Section icon="🕐" title="ประวัติการแก้ไข" description={`${history.length} รายการ`}>
            <div className="relative space-y-0">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                {displayed.map((evt) => {
                    const cfg = EVENT_TYPE_CONFIG[evt.type] ?? EVENT_TYPE_CONFIG.update;
                    return (
                        <div key={evt.id} className="relative flex gap-4 pb-5 last:pb-0">
                            <div className={`relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-surface ${cfg.dot}`}>
                                <span className="h-2 w-2 rounded-full bg-white" />
                            </div>
                            <div className="flex-1 min-w-0 rounded-xl border border-border bg-surface-muted/50 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.pill}`}>
                                        {cfg.label}
                                    </span>
                                    <time className="text-xs text-muted tabular-nums">{formatHistoryDate(evt.at)}</time>
                                </div>
                                <p className="text-sm font-medium text-foreground leading-snug">{evt.summary}</p>
                                {evt.changes?.length > 0 && (
                                    <div className="mt-3 space-y-1.5">
                                        {evt.changes.map((c) => (
                                            <div key={c.field} className="rounded-lg bg-surface px-3 py-2 text-xs space-y-1">
                                                <span className="block font-semibold text-foreground">{c.label}</span>
                                                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                                    <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-600 line-through break-all">{String(c.before)}</span>
                                                    <span className="text-muted shrink-0">→</span>
                                                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700 break-all">{String(c.after)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {history.length > SHOW_STEP && (
                <button onClick={() => setShowAll(v => !v)}
                    className="mt-3 w-full rounded-xl border border-border py-2 text-xs font-medium text-muted hover:border-primary hover:text-primary transition-colors">
                    {showAll ? "แสดงน้อยลง ▲" : `แสดงทั้งหมด ${history.length} รายการ ▼`}
                </button>
            )}
        </Section>
    );
}

// ── Page shell ────────────────────────────────────────────────
export default function StudentDetailPage() {
    const { id } = useParams();
    const { getStudent, students, updateStudent, deleteStudent, ready } = useStudents();
    const { getStudentHistory, addEvent, clearStudentHistory } = useStudentHistory();

    if (!ready) {
        return <div className="flex items-center justify-center py-24 text-muted text-sm">กำลังโหลดข้อมูล...</div>;
    }

    const s = getStudent(id);
    if (!s) {
        return (
            <>
                <AdminTopBar title="ไม่พบข้อมูลนักเรียน" />
                <div className="flex flex-col items-center gap-4 py-24 text-center">
                    <span className="text-5xl">🔍</span>
                    <p className="text-sm text-muted">ไม่พบข้อมูลนักเรียนรหัส <span className="font-mono font-bold text-foreground">{id}</span></p>
                    <Link href="/admin/students/list" className="btn-primary mt-2">กลับรายการนักเรียน</Link>
                </div>
            </>
        );
    }

    const history = getStudentHistory(id);
    const migrated = migrateStudent(s);
    return <StudentDetail key={id} student={migrated} students={students} updateStudent={updateStudent} deleteStudent={deleteStudent} history={history} addEvent={addEvent} clearStudentHistory={clearStudentHistory} />;
}

// ── Main detail component ─────────────────────────────────────
function StudentDetail({ student, students, updateStudent, deleteStudent, history, addEvent, clearStudentHistory }) {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const [editing, setEditing]     = useState(() => searchParams.get("edit") === "1");
    const [form, setForm]           = useState(() => ({ ...student }));
    const [saving, setSaving]       = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
        if (searchParams.get("edit") === "1" && !editing) setEditing(true);
    }, [searchParams]);

    const set  = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
    const setT = (key, sanitize) => (e) => setForm(prev => ({ ...prev, [key]: sanitize(e.target.value) }));

    // class ของ input/select ขึ้นกับ mode — read-only เมื่อดูข้อมูล, editable เมื่อแก้ไข
    const iCls = editing ? inputCls : roInputCls;
    const sCls = editing ? selectCls : roSelectCls;

    // การแก้ไขข้อมูลที่มีอยู่แล้ว — บังคับเฉพาะ name + lastname เท่านั้น
    // (ไม่บังคับ tel/email/university เพราะนักเรียนเก่าอาจยังไม่มีข้อมูลครบ)
    const isValid = form.name?.trim() && form.lastname?.trim();

    const handleEdit   = () => { setForm({ ...student }); setEditing(true); };
    const handleCancel = () => { setForm({ ...student }); setEditing(false); };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isValid) return;
        setSaving(true);
        setSaveError(null);
        try {
            const after = { ...form };
            const changes = diffSnapshot(student, after);

            // Flatten nested addresses → flat API fields (addrThHouseNo etc.)
            // และ normalize ชื่อ field วันเดินทาง (TH→Th, JP→Jp) ให้ตรงกับ STUDENT_FIELDS whitelist
            const payload = {
                ...after,
                addrThHouseNo:       after.addresses?.th?.houseNo     || null,
                addrThSubdistrict:   after.addresses?.th?.subdistrict || null,
                addrThDistrict:      after.addresses?.th?.district    || null,
                addrThProvince:      after.addresses?.th?.province    || null,
                addrThPostalCode:    after.addresses?.th?.postalCode  || null,
                addrJpPostalCode:    after.addresses?.jp?.postalCode    || null,
                addrJpPrefecture:    after.addresses?.jp?.prefecture    || null,
                addrJpCity:          after.addresses?.jp?.city          || null,
                addrJpStreetAddress: after.addresses?.jp?.streetAddress || null,
                addrJpBuilding:      after.addresses?.jp?.building      || null,
                // ฟอร์มเก็บ departureDateTH/arrivalDateJP แต่ API ใช้ Th/Jp (lowercase)
                departureDateTh: after.departureDateTH ?? after.departureDateTh ?? null,
                arrivalDateJp:   after.arrivalDateJP   ?? after.arrivalDateJp   ?? null,
                // ส่ง updatedAt ที่โหลดมาตอนเปิดหน้า ให้ API เช็ค conflict
                updatedAt: student.updatedAt,
            };

            await updateStudent(student.id, payload);

            if (changes.length > 0) {
                addEvent({ studentId: student.id, type: "update", before: { ...student }, after, changes, summary: buildSummary("update", changes) });
            }
            setEditing(false);
        } catch (err) {
            console.error("handleSave:", err);
            setSaveError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        addEvent({ studentId: student.id, type: "delete", before: { ...student }, after: null, changes: [], summary: buildSummary("delete", []) });
        clearStudentHistory(student.id);
        deleteStudent(student.id);
        router.push("/admin/students/list");
    };

    const d = editing ? form : student;

    return (
        <>
            <AdminTopBar
                title={editing ? `แก้ไขข้อมูล — ${d.prefix}${d.name} ${d.lastname}` : `${d.prefix}${d.name} ${d.lastname}`}
                description={d.enrollments?.[0]?.university ?? d.university ?? ""}
            />

            {/* Sticky action bar */}
            {saveError && (
                <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-6 py-2.5 text-sm text-red-700">
                    <span>⚠️ {saveError}</span>
                    <button onClick={() => setSaveError(null)} className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium hover:bg-red-100 transition-colors">ปิด ×</button>
                </div>
            )}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/95 px-6 py-2.5 backdrop-blur">
                <Link href="/admin/students/list"
                    className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    กลับรายการ
                </Link>

                {editing ? (
                    <div className="flex gap-2">
                        <button type="button" onClick={handleCancel}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
                            ยกเลิก
                        </button>
                        <button form="student-form" type="submit" disabled={!isValid || saving}
                            className="inline-flex items-center gap-1.5 rounded-xl btn-primary disabled:opacity-40 disabled:cursor-not-allowed text-sm px-3.5 py-1.5">
                            {saving ? <><Spinner />กำลังบันทึก...</> : <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                บันทึก
                            </>}
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={handleEdit}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-1.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            แก้ไข
                        </button>
                        <button onClick={() => setShowDelete(true)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-1.5 text-sm font-medium text-foreground hover:border-red-400 hover:text-red-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            ลบ
                        </button>
                    </div>
                )}
            </div>

            <div className="p-6 space-y-5">

                <form id="student-form" onSubmit={handleSave} className="space-y-5">

                    {/* Hero card — แสดงเสมอ ทั้ง view/edit mode, d สลับระหว่าง student/form อัตโนมัติ */}
                    <ProfileHeroCard d={d} editing={editing} />

                    {/* ════════════════════════════════
                        SECTIONS (view + edit unified)
                    ════════════════════════════════ */}
                    <>
                            {/* ข้อมูลส่วนตัว */}
                            <Section icon="👤" title="ข้อมูลส่วนตัว">
                                <div className="space-y-4">
                                    {/* สถานะ + ทุนการศึกษา */}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <EField label="สถานะ" required={editing}>
                                            <select value={form.status} onChange={set("status")} disabled={!editing} className={sCls}>
                                                {STATUSES.map(s => <option key={s}>{s}</option>)}
                                            </select>
                                        </EField>
                                        <EField label="ทุนการศึกษา">
                                            <select value={form.scholarship ?? ""} onChange={set("scholarship")} disabled={!editing} className={sCls}>
                                                <option value="">-- ไม่ระบุ --</option>
                                                {SCHOLARSHIPS.map(s => <option key={s} value={s}>{scholarshipLabel(s)}</option>)}
                                            </select>
                                        </EField>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <EField label="คำนำหน้า (ไทย)" required={editing}>
                                            <select value={form.prefix ?? ""} onChange={(e) => {
                                                const opt = PREFIX_OPTIONS.find(o => o.th === e.target.value);
                                                setForm(prev => ({ ...prev, prefix: e.target.value, prefixEn: opt?.en ?? prev.prefixEn, gender: opt?.gender ?? prev.gender }));
                                            }} disabled={!editing} className={sCls}>
                                                {PREFIXES.map(p => <option key={p}>{p}</option>)}
                                            </select>
                                        </EField>
                                        <EField label="ชื่อ (ไทย)" required={editing}>
                                            <input type="text" value={form.name ?? ""} onChange={setT("name", onlyThai)} readOnly={!editing} className={iCls} />
                                        </EField>
                                        <EField label="นามสกุล (ไทย)" required={editing}>
                                            <input type="text" value={form.lastname ?? ""} onChange={setT("lastname", onlyThai)} readOnly={!editing} className={iCls} />
                                        </EField>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <EField label="คำนำหน้า (EN)">
                                            <select
                                                value={String(findPrefixIndex(form.prefix, form.prefixEn))}
                                                onChange={(e) => {
                                                    const opt = PREFIX_OPTIONS[Number(e.target.value)];
                                                    if (!opt) return;
                                                    setForm(prev => ({ ...prev, prefix: opt.th, prefixEn: opt.en, gender: opt.gender }));
                                                }}
                                                disabled={!editing}
                                                className={sCls}
                                            >
                                                {PREFIX_OPTIONS.map((o, i) => (
                                                    <option key={i} value={i}>{o.en}{o.th.startsWith("เด็ก") ? ` (${o.th})` : ""}</option>
                                                ))}
                                            </select>
                                        </EField>
                                        <EField label="First Name (EN)">
                                            <input type="text" value={form.nameEn ?? ""} onChange={setT("nameEn", onlyEnglish)} readOnly={!editing} className={iCls} />
                                        </EField>
                                        <EField label="Last Name (EN)">
                                            <input type="text" value={form.lastnameEn ?? ""} onChange={setT("lastnameEn", onlyEnglish)} readOnly={!editing} className={iCls} />
                                        </EField>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <EField label="ชื่อเล่น">
                                            <input type="text" value={form.nickname ?? ""} onChange={set("nickname")} readOnly={!editing} className={iCls} />
                                        </EField>
                                        <EField label="เพศ">
                                            <select value={form.gender ?? ""} onChange={set("gender")} disabled={!editing} className={sCls}>
                                                <option value="">-- เลือก --</option>
                                                <option value="ชาย">ชาย</option>
                                                <option value="หญิง">หญิง</option>
                                            </select>
                                        </EField>
                                        <EField label="วันเกิด">
                                            <input type="date" value={toDateInputValue(form.dob)} onChange={set("dob")} readOnly={!editing} className={iCls} />
                                        </EField>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <EField label="เลขบัตรประชาชน" hint={editing ? "13 หลัก" : undefined}>
                                            <input type="text" value={form.nationalId ?? ""} onChange={setT("nationalId", formatThaiNationalId)} readOnly={!editing} maxLength={17} className={iCls} inputMode="numeric" />
                                        </EField>
                                        <EField label="เลข Passport">
                                            <input type="text" value={form.passport ?? ""} onChange={setT("passport", onlyAscii)} readOnly={!editing} className={iCls} />
                                        </EField>
                                        <EField label="สถานะเกณฑ์ทหาร" hint={editing ? "เฉพาะเพศชาย" : undefined}>
                                            <select value={form.militaryStatus ?? "-"} onChange={set("militaryStatus")} disabled={!editing} className={sCls}>
                                                {MILITARY_STATUSES.map(m => <option key={m}>{m}</option>)}
                                            </select>
                                        </EField>
                                    </div>
                                </div>
                            </Section>

                            {/* ที่อยู่ | การศึกษา */}
                            <div className="grid gap-5 xl:grid-cols-2">

                                <Section icon="📍" title="ที่อยู่และการติดต่อ">
                                    <div className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <EField label="เบอร์โทรศัพท์" required={editing} hint={editing ? "เช่น 081-234-5678" : undefined}>
                                                <input type="tel" value={form.tel ?? ""} onChange={setT("tel", formatThaiPhone)} readOnly={!editing} maxLength={12} className={iCls} inputMode="numeric" />
                                            </EField>
                                            <EField label="อีเมล" required={editing}>
                                                <input type="email" value={form.email ?? ""} onChange={setT("email", onlyAscii)} readOnly={!editing} className={iCls} />
                                            </EField>
                                            <EField label="LINE ID">
                                                <input type="text" value={form.lineId ?? ""} onChange={setT("lineId", onlyAscii)} readOnly={!editing} className={iCls} />
                                            </EField>
                                            <EField label="ประเทศที่พำนักปัจจุบัน">
                                                <select value={form.country ?? ""} onChange={set("country")} disabled={!editing} className={sCls}>
                                                    <option value="">ไม่ระบุ</option>
                                                    <option value="ไทย">🇹🇭 ไทย</option>
                                                    <option value="ญี่ปุ่น">🇯🇵 ญี่ปุ่น</option>
                                                </select>
                                            </EField>
                                        </div>
                                        <AddressEditTH
                                            value={form.addresses?.th ?? EMPTY_ADDRESS_TH}
                                            editing={editing}
                                            onChange={(updated) => setForm(prev => ({
                                                ...prev,
                                                addresses: { ...(prev.addresses ?? { th: EMPTY_ADDRESS_TH, jp: EMPTY_ADDRESS_JP }), th: updated },
                                            }))}
                                        />
                                        <AddressEditJP
                                            value={form.addresses?.jp ?? EMPTY_ADDRESS_JP}
                                            editing={editing}
                                            onChange={(updated) => setForm(prev => ({
                                                ...prev,
                                                addresses: { ...(prev.addresses ?? { th: EMPTY_ADDRESS_TH, jp: EMPTY_ADDRESS_JP }), jp: updated },
                                            }))}
                                        />
                                    </div>
                                </Section>

                                <Section icon="🏫" title="ข้อมูลการศึกษา"
                                    description={`${(form.enrollments ?? []).length} สถาบัน${editing ? ` · สูงสุด ${MAX_ENROLLMENTS}` : ""}`}>
                                    <div className="space-y-4">
                                        {editing && (form.enrollments ?? []).length < MAX_ENROLLMENTS && (
                                            <button type="button"
                                                onClick={() => setForm(prev => ({
                                                    ...prev,
                                                    enrollments: [...(prev.enrollments ?? []), { ...EMPTY_ENROLLMENT }],
                                                }))}
                                                className="w-full rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted hover:border-primary hover:text-primary transition-colors">
                                                + เพิ่มสถาบันการศึกษา
                                            </button>
                                        )}
                                        <div className="space-y-3">
                                            {(form.enrollments ?? [])
                                                .map((enr, i) => ({ enr, i }))
                                                .reverse()
                                                .map(({ enr, i }) => (
                                                    <EnrollmentEditCard
                                                        key={i}
                                                        enrollment={enr}
                                                        index={i}
                                                        editing={editing}
                                                        total={(form.enrollments ?? []).length}
                                                        onChange={(updated) => setForm(prev => {
                                                            const arr = [...(prev.enrollments ?? [])];
                                                            arr[i] = updated;
                                                            return { ...prev, enrollments: arr };
                                                        })}
                                                        onRemove={() => setForm(prev => ({
                                                            ...prev,
                                                            enrollments: (prev.enrollments ?? []).filter((_, j) => j !== i),
                                                        }))}
                                                    />
                                                ))}
                                        </div>
                                        <div className="border-t border-border pt-4">
                                            <EField label="โรงเรียนเดิม">
                                                <input type="text" value={form.prevSchool ?? ""} onChange={setT("prevSchool", onlyThaiText)} readOnly={!editing} className={iCls} />
                                            </EField>
                                        </div>
                                    </div>
                                </Section>
                            </div>

                            {/* บัญชีธนาคาร */}
                            <Section icon="🏦" title="บัญชีธนาคาร" description="บัญชีรับทุนการศึกษา">
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <EField label="ธนาคาร">
                                        <input type="text" value={form.bankName ?? ""} onChange={setT("bankName", onlyThaiText)} readOnly={!editing}
                                            className={iCls} />
                                    </EField>
                                    <EField label="สาขา">
                                        <input type="text" value={form.bankBranch ?? ""} onChange={setT("bankBranch", onlyThaiText)} readOnly={!editing}
                                            className={iCls} />
                                    </EField>
                                    <EField label="เลขที่บัญชี" hint={editing ? "10 หลัก เช่น 000-0-00000-0" : undefined}>
                                        <input type="text" value={form.bankAccountNo ?? ""} onChange={setT("bankAccountNo", formatThaiBankAccount)} readOnly={!editing}
                                            maxLength={13} className={iCls} inputMode="numeric" />
                                    </EField>
                                </div>
                            </Section>

                            {/* การเดินทาง */}
                            <Section icon="✈️" title="การเดินทาง" description="ข้อมูลวันเดินทางไป-กลับ">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <EField label="วันเดินทางออกจากไทย">
                                        <input type="date" value={toDateInputValue(form.departureDateTH)} onChange={set("departureDateTH")} readOnly={!editing} className={iCls} />
                                    </EField>
                                    <EField label="วันที่ถึงญี่ปุ่น">
                                        <input type="date" value={toDateInputValue(form.arrivalDateJP)} onChange={set("arrivalDateJP")} readOnly={!editing} className={iCls} />
                                    </EField>
                                </div>
                            </Section>

                            {/* หมายเหตุ */}
                            <Section icon="📝" title="หมายเหตุ" description={editing ? "ข้อมูลเพิ่มเติม (ไม่บังคับ)" : undefined}>
                                <textarea value={form.note ?? ""} onChange={set("note")} readOnly={!editing} rows={3}
                                    className={iCls + " resize-none"} />
                            </Section>


                            {/* ประวัติการแก้ไข — แสดงเสมอ */}
                            <HistorySection history={history} />
                    </>

                </form>
            </div>

            {showDelete && (
                <DeleteModal
                    name={`${student.prefix}${student.name} ${student.lastname}`}
                    id={student.id}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDelete(false)}
                />
            )}
        </>
    );
}
