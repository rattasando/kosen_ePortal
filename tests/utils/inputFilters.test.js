import { describe, it, expect } from "vitest";
import {
  onlyThai,
  onlyThaiText,
  onlyEnglish,
  onlyEnglishAddress,
  onlyNumeric,
  onlyAscii,
  formatThaiPhone,
  formatThaiNationalId,
  formatThaiBankAccount,
} from "@/lib/utils/inputFilters";

// ── onlyThai ──────────────────────────────────────────────────
describe("onlyThai", () => {
  it("คงอักษรไทยไว้", () => expect(onlyThai("สมชาย")).toBe("สมชาย"));
  it("คงเว้นวรรคไว้", () => expect(onlyThai("สมชาย ใจดี")).toBe("สมชาย ใจดี"));
  it("ตัดอักษรอังกฤษออก", () => expect(onlyThai("สมชายABC")).toBe("สมชาย"));
  it("ตัดตัวเลขออก", () => expect(onlyThai("สมชาย123")).toBe("สมชาย"));
  it("ตัดสัญลักษณ์ออก", () => expect(onlyThai("สมชาย!@#")).toBe("สมชาย"));
  it("string ว่างคืนค่าว่าง", () => expect(onlyThai("")).toBe(""));
});

// ── onlyThaiText ──────────────────────────────────────────────
describe("onlyThaiText", () => {
  it("คงอักษรไทย + ตัวเลข + วงเล็บไว้", () =>
    expect(onlyThaiText("โรงเรียนสาธิต 2 (กรุงเทพ)")).toBe("โรงเรียนสาธิต 2 (กรุงเทพ)"));
  it("ตัดอักษรอังกฤษออก", () => expect(onlyThaiText("กรุงเทพABC")).toBe("กรุงเทพ"));
  it("คง . / - ไว้ (ใช้ในที่อยู่)", () =>
    expect(onlyThaiText("สาขา/ลาดพร้าว")).toBe("สาขา/ลาดพร้าว"));
});

// ── onlyEnglish ───────────────────────────────────────────────
describe("onlyEnglish", () => {
  it("คงอักษรละตินไว้", () => expect(onlyEnglish("John")).toBe("John"));
  it("คง apostrophe และ hyphen ไว้", () =>
    expect(onlyEnglish("O'Brien Al-Amin")).toBe("O'Brien Al-Amin"));
  it("ตัดตัวเลขออก", () => expect(onlyEnglish("John123")).toBe("John"));
  it("ตัดอักษรไทยออก", () => expect(onlyEnglish("Johnสมชาย")).toBe("John"));
});

// ── onlyEnglishAddress ────────────────────────────────────────
describe("onlyEnglishAddress", () => {
  it("คงตัวอักษร EN + ตัวเลข + สัญลักษณ์ที่อยู่ไว้", () =>
    expect(onlyEnglishAddress("1-2-3, Shinjuku-ku")).toBe("1-2-3, Shinjuku-ku"));
  it("ตัดอักษรไทยออก", () =>
    expect(onlyEnglishAddress("Bangkokกรุงเทพ")).toBe("Bangkok"));
});

// ── onlyNumeric ───────────────────────────────────────────────
describe("onlyNumeric", () => {
  it("คงตัวเลขและขีดไว้", () => expect(onlyNumeric("081-234-5678")).toBe("081-234-5678"));
  it("ตัดอักษรออก", () => expect(onlyNumeric("081abc")).toBe("081"));
  it("string ว่างคืนค่าว่าง", () => expect(onlyNumeric("")).toBe(""));
});

// ── onlyAscii ─────────────────────────────────────────────────
describe("onlyAscii", () => {
  it("คง ASCII มาตรฐานไว้", () => expect(onlyAscii("test@email.com")).toBe("test@email.com"));
  it("ตัดอักษรไทยออก", () => expect(onlyAscii("testสมชาย")).toBe("test"));
  it("คง space ไว้", () => expect(onlyAscii("hello world")).toBe("hello world"));
});

// ── formatThaiPhone ───────────────────────────────────────────
describe("formatThaiPhone", () => {
  it("จัดรูปแบบ 10 หลักเป็น xxx-xxx-xxxx", () =>
    expect(formatThaiPhone("0812345678")).toBe("081-234-5678"));
  it("ใส่ขีดซ้ำซ้อน → clean ให้อัตโนมัติ", () =>
    expect(formatThaiPhone("081-234-5678")).toBe("081-234-5678"));
  it("จำกัดที่ 10 หลัก — เกินตัด", () =>
    expect(formatThaiPhone("08123456789999")).toBe("081-234-5678"));
  it("พิมพ์ระหว่างกลาง → จัดรูปแบบ partial", () =>
    expect(formatThaiPhone("081")).toBe("081"));
  it("string ว่างคืนค่าว่าง", () => expect(formatThaiPhone("")).toBe(""));
});

// ── formatThaiNationalId ──────────────────────────────────────
describe("formatThaiNationalId", () => {
  it("จัดรูปแบบ 13 หลักเป็น x-xxxx-xxxxx-xx-x", () =>
    expect(formatThaiNationalId("1234567890123")).toBe("1-2345-67890-12-3"));
  it("จำกัดที่ 13 หลัก", () =>
    expect(formatThaiNationalId("12345678901239999")).toBe("1-2345-67890-12-3"));
  it("partial input", () =>
    expect(formatThaiNationalId("12345")).toBe("1-2345"));
});

// ── formatThaiBankAccount ─────────────────────────────────────
describe("formatThaiBankAccount", () => {
  it("จัดรูปแบบ 10 หลักเป็น xxx-x-xxxxx-x", () =>
    expect(formatThaiBankAccount("0001234567")).toBe("000-1-23456-7"));
  it("ไม่ตัดเลขที่เกิน 10 หลัก (รองรับบางธนาคาร)", () =>
    expect(formatThaiBankAccount("000123456789").length).toBeGreaterThan(0));
});
