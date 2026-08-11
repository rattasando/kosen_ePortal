// ── Character-class input filters ──────────────────────────────
// ตัดอักขระที่ไม่ตรงกับประเภทข้อมูลออกทันทีตอนพิมพ์/วาง เพื่อกันข้อมูลปนภาษา
// หรือปนตัวเลขผิดประเภท ใช้กับ onChange ของ <input> โดยตรง (ทำงานกับ paste
// ด้วย เพราะกรองค่าจาก event ทุกครั้ง ไม่ใช่แค่ keydown)
//
// ฀-๿ คือช่วง Unicode ของอักษรไทย

// ชื่อ-นามสกุลภาษาไทย — อักษรไทยล้วน + เว้นวรรค (ห้ามมีเลข/อักษรอื่นปน)
export const onlyThai = (s) => s.replace(/[^฀-๿\s]/g, "");

// ข้อความภาษาไทยทั่วไป (ชื่อสถานที่/สถาบัน/ธนาคาร) — อักษรไทย + ตัวเลข + เว้นวรรค
// + สัญลักษณ์ที่พบได้ เช่น "โรงเรียนสาธิต 2", "สาขาลาดพร้าว"
export const onlyThaiText = (s) => s.replace(/[^฀-๿0-9\s./()-]/g, "");

// ชื่อ-นามสกุลภาษาอังกฤษ — อักษรละติน + เว้นวรรค + ' . - (เช่น O'Brien, Al-Amin)
export const onlyEnglish = (s) => s.replace(/[^A-Za-z\s'.-]/g, "");

// ที่อยู่แบบโรมาจิ (ญี่ปุ่น) — อักษรละติน + ตัวเลข + เว้นวรรค + , . / -
export const onlyEnglishAddress = (s) => s.replace(/[^A-Za-z0-9\s,./-]/g, "");

// ตัวเลขล้วน + ขีด — เลขบัตรประชาชน/เบอร์โทร/เลขบัญชี/รหัสไปรษณีย์
export const onlyNumeric = (s) => s.replace(/[^0-9-]/g, "");

// ASCII ทั่วไป (ตัวอักษร EN + ตัวเลข + สัญลักษณ์มาตรฐาน) — อีเมล, LINE ID,
// เลข Passport, รหัสนักศึกษาที่สถาบัน — บล็อกเฉพาะอักษรไทย/นอก ASCII ที่พิมพ์ผิดเข้ามา
export const onlyAscii = (s) => s.replace(/[^\x20-\x7E]/g, "");

// ── Auto-format ตอนพิมพ์ (ใส่ขีดให้อัตโนมัติ) ────────────────────
// ดึงเฉพาะตัวเลขจาก input แล้วประกอบขีดใหม่ตามรูปแบบ ทำให้พิมพ์ต่อจากขีดที่มี
// อยู่แล้วได้เรื่อยๆ โดยไม่ต้องพิมพ์ขีดเอง — เก็บใน DB เป็นรูปแบบมีขีดนี้ตรงๆ
// (ดู lib/utils/studentFieldLimits.js ที่กำหนดความยาว column ให้พอรองรับขีดอยู่แล้ว)

// จัดกลุ่มตัวเลขคั่นด้วยขีดตาม `groups` (เช่น [3,3,4] → XXX-XXX-XXXX)
// เลขที่เกินจำนวนกลุ่มที่กำหนดไว้จะต่อท้ายดิบๆ ไม่ตัดทิ้ง (เผื่อกรณีเลขยาวกว่ารูปแบบมาตรฐาน)
// `maxDigits` (ถ้าระบุ) จะจำกัดจำนวนหลักที่รับได้สูงสุด
function formatDigitGroups(raw, groups, maxDigits) {
    let digits = raw.replace(/\D/g, "");
    if (maxDigits) digits = digits.slice(0, maxDigits);
    const parts = [];
    let i = 0;
    for (const len of groups) {
        if (i >= digits.length) break;
        const chunk = digits.slice(i, i + len);
        parts.push(chunk);
        i += chunk.length;
    }
    if (i < digits.length) parts.push(digits.slice(i));
    return parts.join("-");
}

// เบอร์โทรศัพท์ไทย 10 หลัก — 081-234-5678
export const formatThaiPhone = (raw) => formatDigitGroups(raw, [3, 3, 4], 10);

// เลขบัตรประชาชนไทย 13 หลัก — 1-2345-67890-12-3
export const formatThaiNationalId = (raw) => formatDigitGroups(raw, [1, 4, 5, 2, 1], 13);

// เลขที่บัญชีธนาคาร — รูปแบบ 10 หลักที่พบทั่วไป (เช่น กสิกรไทย) — 000-0-00000-0
// ธนาคารอื่นบางแห่งจัดกลุ่มต่างกันหรือมีมากกว่า 10 หลัก จึงไม่จำกัดความยาวสูงสุด
// (เกิน 10 หลักจะต่อท้ายกลุ่มสุดท้ายแทนที่จะตัดทิ้ง)
export const formatThaiBankAccount = (raw) => formatDigitGroups(raw, [3, 1, 5, 1]);
