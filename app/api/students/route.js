import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  STUDENT_ID_LIMIT,
  STUDENT_VARCHAR_LIMITS,
  ENROLLMENT_VARCHAR_LIMITS,
  findTooLongFields,
  describeTooLongFields,
} from "@/lib/utils/studentFieldLimits";
import { prepEnrollments } from "@/lib/utils/studentEnrollments";
import { formatApiError } from "@/lib/utils/apiError";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where = {};
    if (status) where.status = status;

    const students = await prisma.student.findMany({
      where,
      orderBy: { id: "asc" },
      include: { enrollments: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json(students);
  } catch (err) {
    console.error("GET /api/students:", err);
    const { body, status } = formatApiError(err);
    return NextResponse.json(body, { status });
  }
}

const STUDENT_FIELDS = [
  "id",
  "prefix","prefixEn","name","nameEn","lastname","lastnameEn","nickname","gender","dob",
  "nationalId","passport","militaryStatus","tel","email","lineId","country",
  "addrThHouseNo","addrThSubdistrict","addrThDistrict","addrThProvince","addrThPostalCode",
  "addrJpPostalCode","addrJpPrefecture","addrJpCity","addrJpStreetAddress","addrJpBuilding",
  "prevSchool","scholarship","selfFunded","scholarshipTypeId",
  "departureDateTh","arrivalDateJp","status","note","avatar","createdBy",
];

// แปลง "" → null ทุก field (ยกเว้น id ที่ต้องเป็น string เสมอ)
function nullifyEmpty(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === "" ? null : v])
  );
}

// flatten nested addresses → flat addrTh*/addrJp* fields (รองรับทั้ง import และฟอร์ม)
function flattenBody(body) {
  const out = { ...body };
  if (body.addresses) {
    const th = body.addresses.th ?? {};
    const jp = body.addresses.jp ?? {};
    out.addrThHouseNo      = th.houseNo      ?? out.addrThHouseNo      ?? null;
    out.addrThSubdistrict  = th.subdistrict  ?? out.addrThSubdistrict  ?? null;
    out.addrThDistrict     = th.district     ?? out.addrThDistrict     ?? null;
    out.addrThProvince     = th.province     ?? out.addrThProvince     ?? null;
    out.addrThPostalCode   = th.postalCode   ?? out.addrThPostalCode   ?? null;
    out.addrJpPostalCode   = jp.postalCode   ?? out.addrJpPostalCode   ?? null;
    out.addrJpPrefecture   = jp.prefecture   ?? out.addrJpPrefecture   ?? null;
    out.addrJpCity         = jp.city         ?? out.addrJpCity         ?? null;
    out.addrJpStreetAddress= jp.streetAddress?? out.addrJpStreetAddress?? null;
    out.addrJpBuilding     = jp.building     ?? out.addrJpBuilding     ?? null;
  }
  // normalize date field name casing (departureDateTH → departureDateTh)
  if (out.departureDateTH !== undefined && out.departureDateTh === undefined)
    out.departureDateTh = out.departureDateTH;
  if (out.arrivalDateJP !== undefined && out.arrivalDateJp === undefined)
    out.arrivalDateJp = out.arrivalDateJP;
  return out;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { enrollments } = body;
    const flattened = flattenBody(body);

    // whitelist — กรองเฉพาะ field ที่ Prisma รู้จัก แล้ว nullify "" ทุก field
    const data = {
      ...nullifyEmpty(Object.fromEntries(
        STUDENT_FIELDS.filter((k) => k in flattened).map((k) => [k, flattened[k]])
      )),
      id: flattened.id, // id ต้องเป็น string เสมอ ห้าม null
    };
    // ตรวจ id — ถ้าส่ง "" มาชัดเจน ให้ reject; ถ้าไม่ส่งมา (undefined) ให้ auto-generate
    if (data.id === "") {
      return NextResponse.json({ error: "id ของนักเรียนจำเป็นต้องมีค่า" }, { status: 400 });
    }
    if (!data.id) {
      data.id = `S${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase().slice(0, 20);
    }

    // field ที่ไม่ nullable ใน schema — ใส่ fallback ถ้า nullifyEmpty แปลง "" → null
    data.status   = data.status   ?? "กำลังศึกษา";
    data.name     = data.name     ?? "";
    data.lastname = data.lastname ?? "";

    const tooLong = [
      ...findTooLongFields({ id: data.id }, { id: STUDENT_ID_LIMIT }),
      ...findTooLongFields(data, STUDENT_VARCHAR_LIMITS),
      ...(enrollments ?? []).flatMap((e, i) =>
        findTooLongFields(e, ENROLLMENT_VARCHAR_LIMITS).map((err) => ({
          ...err,
          field: `enrollments[${i}].${err.field}`,
        }))
      ),
    ];
    if (tooLong.length > 0) {
      return NextResponse.json(
        { error: `ข้อมูลนักเรียน ${data.id ?? ""}: มีข้อความยาวเกินกำหนด — ${describeTooLongFields(tooLong)}` },
        { status: 400 }
      );
    }

    const student = await prisma.student.create({
      data: {
        ...data,
        dob: data.dob ? new Date(data.dob) : null,
        departureDateTh: data.departureDateTh ? new Date(data.departureDateTh) : null,
        arrivalDateJp: data.arrivalDateJp ? new Date(data.arrivalDateJp) : null,
        enrollments: enrollments?.length
          ? { create: prepEnrollments(enrollments) }
          : undefined,
      },
      include: { enrollments: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json(student, { status: 201 });
  } catch (err) {
    console.error("POST /api/students:", err);
    const { body, status } = formatApiError(err);
    return NextResponse.json(body, { status });
  }
}
