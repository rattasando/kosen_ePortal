@AGENTS.md

# KOSEN ePortal — Project Guide

## ⚠️ กฎสำคัญ — ต้องถามก่อนเสมอ
**ห้าม commit หรือ push โดยไม่ได้รับอนุญาตจากผู้ใช้ก่อนทุกครั้ง**
ทำงาน/แก้โค้ดได้เลย แต่เมื่อจะ commit/push ต้องถามก่อนว่า "พร้อม commit ได้เลยไหม?"

## โมดูลทั้งหมดในระบบ (Admin)

### 👨‍🎓 Students
| โมดูล | Path | Client Component | สถานะ |
|-------|------|-----------------|-------|
| รายชื่อนักเรียน | `/admin/students/list` | `StudentListClient.js` | ✅ ใช้งานได้ |
| รายละเอียดนักเรียน | `/admin/students/[id]` | — (inline) | ✅ |
| แก้ไขนักเรียน | `/admin/students/[id]/edit` | — | ✅ |
| เพิ่มนักเรียนใหม่ | `/admin/students/new` | — | ✅ |
| ศิษย์เก่า (Alumni) | `/admin/students/alumni` | `alumni/page.js` (inline) | ✅ |
| รายละเอียดศิษย์เก่า | `/admin/students/alumni/[id]` | — | ✅ |
| เอกสารนักเรียน | `/admin/students/documents` | — | 🔧 ยังไม่สมบูรณ์ |
| ติดตามผลการเรียน | `/admin/students/academic-tracking` | — | 🔧 |
| ทุนการศึกษา | `/admin/students/scholarship` | — | 🔧 |

### 🏢 Companies
| โมดูล | Path | Client Component | สถานะ |
|-------|------|-----------------|-------|
| รายชื่อบริษัท | `/admin/companies/list` | `CompanyListClient.js` | ✅ |
| รายละเอียดบริษัท | `/admin/companies/[id]` | `CompanyDetailClient.js` | ✅ |

### 💼 Marketplace
| โมดูล | Path | Client Component | สถานะ |
|-------|------|-----------------|-------|
| ตำแหน่งงาน (Job Positions) | `/admin/marketplace/job-positions` | `JobListClient.js` | ✅ |
| รายละเอียดตำแหน่งงาน | `/admin/marketplace/job-positions/[id]` | — | ✅ |
| เพิ่มตำแหน่งงาน | `/admin/marketplace/job-positions/new` | — | ✅ |
| การสมัครงาน (Applications/Mapping) | `/admin/marketplace/applications` | `MappingListClient.js` | ✅ |
| รายละเอียดการสมัคร | `/admin/marketplace/applications/[id]` | — | ✅ |
| เพิ่มการสมัครงาน | `/admin/marketplace/applications/new` | — | ✅ |
| ติดตามการฝึกงาน | `/admin/marketplace/internship-tracking` | `InternshipListClient.js` | 🔧 |

### 📢 Information
| โมดูล | Path | Client Component | สถานะ |
|-------|------|-----------------|-------|
| ข่าวสาร (News) | `/admin/information/news` | `NewsListClient.js` | ✅ |
| กิจกรรม (Activities) | `/admin/information/activities` | — | 🔧 |
| คำถามที่พบบ่อย (FAQ) | `/admin/information/faq` | `FaqListClient.js` | ✅ |
| เอกสาร (Documents) | `/admin/information/documents` | `DocumentListClient.js` | ✅ |
| แบนเนอร์ (Banner) | `/admin/information/banner` | — (BannerContext) | ✅ |
| Splash Screen | `/admin/information/splash` | `SplashConfigClient.js` | ✅ |
| ติดต่อเรา (Contact) | `/admin/information/contact` | `ContactListClient.js` | 🔧 |
| หมวดหมู่ข่าว | `/admin/information/news-categories` | `NewsCategoriesListClient.js` | 🔧 |
| ประเภททุน | `/admin/information/scholarship-types` | `ScholarshipTypesListClient.js` | 🔧 |

### ⚙️ System
| โมดูล | Path | Client Component | สถานะ |
|-------|------|-----------------|-------|
| จัดการผู้ใช้ | `/admin/users` | `UserListClient.js` | 🔧 |

> ✅ = มี Client Component + ทำงานได้เต็มที่ · 🔧 = อยู่ระหว่างพัฒนา / stub

## Stack
- **Next.js 16** (App Router) + **React 19**
- **Prisma v7** + **PostgreSQL** (via `@prisma/adapter-pg`)
- **NextAuth v5** (Auth.js beta) — JWT session
- **bcryptjs** — password hashing
- **TypeScript** seed script (run via `tsx`)

## Project Structure
```
app/
  (public)/         → Public-facing pages (localStorage ยังไม่ได้ migrate)
  admin/            → Admin pages (ต้อง login)
  api/              → API routes ทั้งหมด
components/
  admin/
    contexts/       → Context providers (ดึงข้อมูลจาก API แล้วทุกตัว)
lib/
  prisma.js         → Prisma singleton client
  generated/prisma/ → Generated Prisma client (อย่าแก้มือ)
prisma/
  schema.prisma     → DB schema (23 models, 10 enums)
  seed.ts           → Seed script
auth.js             → NextAuth full config (Node.js only)
auth.config.js      → NextAuth Edge-compatible config (no Prisma)
proxy.js            → แทน middleware.js (deprecated ใน Next.js 16)
```

## Next.js 16 Breaking Changes
- `middleware.js` → เปลี่ยนชื่อเป็น `proxy.js`
- `params` ใน dynamic routes เป็น Promise ต้อง `await` ก่อนใช้:
  ```js
  export async function GET(_, { params }) {
    const { id } = await params; // ต้อง await
  }
  ```

## Prisma v7 — สำคัญมาก
- ต้องใช้ driver adapter เสมอ — ไม่มี connection string ใน schema
- `lib/prisma.js`:
  ```js
  import { PrismaPg } from "@prisma/adapter-pg";
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
  ```
- หลังแก้ schema ต้องรัน:
  ```bash
  npx prisma migrate dev --name <ชื่อ>
  npx prisma generate
  ```
- Prisma client อยู่ที่ `lib/generated/prisma/` (ไม่ใช่ `node_modules/@prisma/client`)

## NextAuth v5 — Split Pattern
แยกเป็น 2 ไฟล์เพื่อหลีกเลี่ยง Edge Runtime error:
- `auth.config.js` — Edge-compatible (ไม่ import Prisma/bcrypt) ใช้ใน `proxy.js`
- `auth.js` — Node.js full config (มี Prisma + bcrypt) ใช้ใน API routes

## Authentication
- Login: username + password (bcryptjs hash) ผ่าน `signIn("credentials", ...)` จาก `next-auth/react` — ดู `app/(public)/login/page.js` (มี checkbox "จดจำผู้ใช้" เก็บ username ล่าสุดไว้ที่ `localStorage["kosen_remember_user"]`)
- Logout: ต้องใช้ `signOut()` จาก `next-auth/react` เท่านั้น — ห้ามล้าง localStorage เองแล้วหวังว่าจะ logout (ดู Known Bugs Fixed)
- Session: JWT
- Seed users: `lib/data/userData.js` (`DEFAULT_USERS`) — ทุกคน password `Kosen@2024!` ยกเว้น `admin` / `admin` (superadmin, เพิ่มไว้ใช้ตอน dev)
- หน้า `/admin/*` protected ด้วย `proxy.js`

## API Routes Convention
```js
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    // ... prisma query
    return NextResponse.json(result);
  } catch (err) {
    console.error("PUT /api/entity/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

## Known Bugs Fixed

### Student PUT — unknown fields
Prisma ไม่รับ field ที่ไม่อยู่ใน schema เช่น `university`, `history` ที่ติดมาจาก form
**แก้:** ใช้ whitelist `STUDENT_FIELDS` array กรอง field ก่อนส่ง Prisma
```js
const STUDENT_FIELDS = ["prefix", "name", "lastname", ...];
const data = Object.fromEntries(
  STUDENT_FIELDS.filter((k) => k in body).map((k) => [k, body[k]])
);
```

### Student PUT/POST — enrollment id/order
ตอน create enrollment ใหม่ ต้อง strip `id`, `studentId` ออกก่อน **และห้ามเชื่อค่า `order` ที่ติดมากับ payload** — enrollment ที่เพิ่งเพิ่ม (กด "+ เพิ่มสถาบันการศึกษา") ไม่มี `order` เลย ถ้าปล่อยผ่าน Prisma จะใช้ `@default(1)` ชนกับสถาบันแรกที่มี `order: 1` อยู่แล้ว → `Unique constraint failed on the fields: (student_id, order)`
**แก้:** บังคับ `order` จากตำแหน่งใน array เสมอ ใช้ util กลาง `lib/utils/studentEnrollments.js` → `prepEnrollments()` (ใช้ร่วมกันทั้ง POST/PUT, แปลง `startDate`/`endDate` เป็น Date object ให้ด้วย):
```js
enrollments.map(({ id: _id, studentId: _sid, order: _order, ...e }, i) => ({ ...e, order: i + 1 }))
```

### StudentEnrollment — startDate/endDate convention
`endDate` เป็น `null` = สถาบันปัจจุบัน (ยังไม่จบ/ยังไม่ย้ายออก) — ทุกที่ที่ต้องหา "สถาบันล่าสุด/ปัจจุบัน" ให้เช็ค `endDate == null` ก่อน (แม่นกว่าเดาจาก array index อย่างเดียว) ดู `getLatestEnrollment()` ใน `StudentListClient.js`

### Prisma client ไม่ sync หลัง migrate ถ้า dev server รันค้างอยู่
`lib/prisma.js` ใช้ singleton pattern (`globalForPrisma.prisma ?? createPrisma()`) กัน hot-reload สร้าง connection ซ้ำตอน dev — ผลคือรัน `prisma migrate dev` + `generate` ระหว่างที่ dev server ตัวเดิมรันค้างอยู่แล้ว จะยังได้ error `Unknown argument <newField>` เพราะ client เก่ายังอยู่ใน memory
**แก้:** ต้อง restart dev server (`Ctrl+C` แล้ว `npm run dev` ใหม่) ทุกครั้งหลัง schema เปลี่ยน ไม่ใช่แค่ `prisma generate` เฉยๆ

### `<input type="date">` ต้องการ format `YYYY-MM-DD` เป๊ะ
API ส่งวันที่กลับมาเป็น ISO datetime เต็ม (`"2005-05-13T00:00:00.000Z"`) — ใส่ตรงๆ ใน `value` ของ `<input type="date">` แล้ว browser จะมองว่า invalid แล้วโชว์ว่างเปล่า (ทั้งที่มีข้อมูลจริงอยู่)
**แก้:** ตัดเหลือ 10 ตัวอักษรแรกก่อนเสมอ — `toDateInputValue(v) => v ? String(v).slice(0, 10) : ""`

### Bulk update/import ยิง request แบบไม่รอผล → error หายไปเงียบๆ
โค้ด import เดิมยิง `updateStudent()`/`addStudent()` แบบ fire-and-forget ในลูป (ไม่ `await`/`catch`) — ถ้า request ไหน fail (เช่น field ยาวเกิน VarChar limit) จะกลายเป็น unhandled promise rejection ทำให้ dev overlay ขึ้น crash แทนที่จะโชว์ error ที่อ่านออก
**แก้:** `await`/`try-catch` ทีละแถวใน `handleImport()` (`StudentListClient.js`) เก็บ error รายแถวมาโชว์สรุปผลจริงหลัง import (สำเร็จ/ล้มเหลวกี่รายการ)

### Prisma "value too long" ไม่บอกชื่อ column
Prisma เองมี validation ความยาวก่อนถึง Postgres (error P2000) แต่บางกรณีไม่ยอมบอกชื่อ column (`Column: (not available)`) โดยเฉพาะตอน bulk import/update
**แก้:** เช็คความยาวฝั่ง API เองก่อนเสมอด้วย `lib/utils/studentFieldLimits.js` (map ตาม `@db.VarChar(n)` ในสกีมา) แล้วคืน error ที่บอกชื่อ field + ความยาวจริงให้ชัดเจน

### History log สร้าง diff ปลอม (ประวัติแก้ไขนักเรียน)
`diffSnapshot(before, after)` ใน `studentHistoryHelpers.js` เทียบ before/after ทีละ key — ถ้า `after` มี key ที่ `before` ไม่มี (เช่นเคย flatten `university` เข้า `after` แต่ไม่ได้ทำกับ `before`) จะเห็นเป็น "เปลี่ยนแปลง" ปลอมทุกครั้งที่ save ทั้งที่ไม่ได้แก้อะไรจริง
**แก้:** `before`/`after` ที่ส่งเข้า `diffSnapshot()` ต้องมี shape ตรงกันเป๊ะเสมอ ห้าม flatten field พิเศษใส่ฝั่งเดียว

### News/Activities PUT — blocks
ต้อง delete blocks เก่าก่อน แล้ว create ใหม่ใน `$transaction`
Strip `id` จาก blocks ก่อน create เช่นกัน

## Database
- DB name: `kosen_eportal`
- Local: `postgresql://<user>:<password>@localhost:5432/kosen_eportal` (ดู Environment Variables ด้านล่าง — ต้องมี user:password เกือบทุกเครื่อง)
- Seed: `npm run seed`
- Reset + seed: `npx prisma migrate reset --skip-seed && npm run seed`

## Git Branches
- `main` → localStorage version (Vercel deploy)
- `dev` → PostgreSQL version (พัฒนาต่อบนนี้) — **ปิด Vercel auto-deploy** ด้วย `vercel.json` แล้ว (dev ใช้ Prisma+PG ไม่มี DATABASE_URL ใน Vercel → deploy fail ทุกครั้ง)

## Environment Variables (.env)
```
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/kosen_eportal"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```
- ไฟล์ `.env` ไม่ commit เข้า git (`.gitignore` มี `.env*`) — ต้องสร้างเองทุกเครื่อง/ทุก OS ที่ clone มาใหม่ (รวมถึง Mac)
- ต้องมี `<user>:<password>` นำหน้า host เสมอถ้า local PostgreSQL ตั้ง auth ไว้ ไม่งั้นจะเจอ `P1010: User was denied access` — เช็ค credentials จาก pgAdmin/psql ของเครื่องนั้นๆ เอา (ไม่ใช่ credentials เดียวกันข้ามเครื่อง)
- ต้องสร้าง database `kosen_eportal` เองก่อนด้วย (ไม่ auto-create) แล้วค่อย `npx prisma migrate deploy` + `npm run seed`

## Commands
```bash
npm run dev          # รัน dev server
npm run build        # build
npm run seed         # seed ข้อมูล
npx prisma studio    # ดูข้อมูลใน browser
npx prisma migrate dev --name <name>  # สร้าง migration ใหม่
npx prisma generate  # regenerate client หลังแก้ schema

# E2E Tests (Playwright)
npm run e2e:ui       # เปิด Playwright UI — เลือก test รันได้ พร้อม trace/screenshot
npm run e2e:headed   # รันทั้ง suite แบบเห็น browser จริง
npx playwright test  # รันทั้ง suite แบบ headless
npx playwright test <file> --headed  # รันแค่ไฟล์เดียว
```

## Shared Utilities (`lib/utils/`)
- `inputFilters.js` — character-class filters (`onlyThai`, `onlyEnglish`, `onlyNumeric`, `onlyAscii`, `onlyThaiText`, `onlyEnglishAddress`) ใช้กรอง input ตอน `onChange` ให้ตรงประเภทข้อมูล (ไทย/อังกฤษ/ตัวเลข) + auto-formatter ใส่ขีดให้อัตโนมัติ (`formatThaiPhone`, `formatThaiNationalId`, `formatThaiBankAccount`)
- `studentFieldLimits.js` — map ความยาว `@db.VarChar(n)` ของ Student/StudentEnrollment ไว้ validate ฝั่ง API ก่อนถึง Prisma (กัน error "value too long" ที่บางทีไม่บอกชื่อ column) — **ไม่มี bank fields แล้ว** (ลบออกพร้อม schema)
- `studentFilters.js` — `matchStudentField()` รองรับค้นหาด้วยชื่อ+นามสกุลรวม (`"สมชาย ใจดี"`) และ prefix+ชื่อ+นามสกุล (`"นายสมชาย ใจดี"`) และ English full name — ไม่ใช่แค่ field เดี่ยว
- `studentEnrollments.js` — `prepEnrollments()` ใช้ร่วมกันทั้ง POST/PUT: บังคับ `order` ตามตำแหน่งใน array + แปลง `startDate`/`endDate` เป็น Date object
- `studentHistoryHelpers.js` — `diffSnapshot()` เทียบ before/after เพื่อ log ประวัติแก้ไขนักเรียน — **ระวัง**: `before`/`after` ต้องมี shape ตรงกันเป๊ะ ไม่งั้นเกิด diff ปลอม (ดู Known Bugs Fixed)

## Alumni (`/admin/students/alumni`)

### Schema
`Alumni` model มี field: `id`, `studentId`, `prefix`, `name`, `lastname`, `nameEn`, `lastnameEn`, `nickname`, `graduatedYear`, `major`, `university`, `scholarshipTypeId`, `scholarshipYears`, `scholarshipStatus`, `contact`, `phone`, `remark`, `createdAt`, `updatedAt` + relations `employmentHistory`, `history`

`AlumniHistory` model: `id`, `alumniId`, `oldData`, `newData`, `actionType`, `changedBy`, `changedAt` — เก็บ event ทุก save บน detail page

### List page (`alumni/page.js`)
- ใช้ `AdminTable` + pagination + checkbox multi-select (เหมือน student list)
- กดแถวทั้งหมดเพื่อดูรายละเอียด (`onRowClick`) ยกเว้น checkbox column 0 ที่ใช้ `onCellClick`
- Selection bar แสดงเมื่อเลือก ≥ 1 รายการ: count + export CSV + ยกเลิก
- Name cell แสดง 3 บรรทัด: ชื่อไทย → ชื่ออังกฤษ (ถ้ามี) → `ชื่อเล่น: X` (ถ้ามี)
- Filter persistence ผ่าน `sessionStorage` (key: `alumni-list-filters`)
- Sort options: `newest/oldest/updated/th_az/th_za/year_desc/year_asc`

### Detail page (`alumni/[id]/page.js`)
- Sticky back bar ด้านบน (เหมือน student) — `sticky top-0 z-20 bg-surface/95 backdrop-blur`
- Profile card: gradient strip + rounded-2xl avatar + nickname pill + inline badges
- Per-card editing: แต่ละ card มีปุ่ม Edit/Save/Cancel ของตัวเอง (ต่างจาก student ที่ edit ทั้งหน้า)
- ปุ่ม "ดึงข้อมูลจาก student" — ดึง `name`, `lastname`, `nameEn`, `lastnameEn`, `nickname`, `contact`, `phone` จาก student ที่ link ไว้
- **ประวัติการแก้ไข**: card ด้านล่างสุดแสดง history events (collapsible) — กดที่แต่ละ event ดู field diff ได้
  - `startEdit(card)` จะ capture `beforeSnapshot` ทุกครั้ง
  - `saveProfile/saveScholarship/saveHistory/saveRemark` เป็น async — call `updateAlumni` แล้ว `diffAlumniSnapshot` แล้ว `addEvent`
  - ใช้ `useAlumniHistory()` จาก `AlumniHistoryContext`

### Alumni History
- Context: `components/admin/contexts/AlumniHistoryContext.js` — `AlumniHistoryProvider`, `useAlumniHistory()`
- API: `GET/POST/DELETE /api/alumni-history` — เหมือน `/api/student-history` แต่ใช้ `prisma.alumniHistory`
- Helpers: `lib/utils/alumniHistoryHelpers.js`
  - `diffAlumniSnapshot(before, after)` — flatten diff (รวม employmentHistory diff ทีละ field + count)
  - `buildAlumniSummary(type, changes)` — สร้าง summary string
  - `formatHistoryDate(isoString)` — แปลง ISO → ภาษาไทย
- Provider ถูก wrap ใน `app/admin/layout.js` ระหว่าง `StudentHistoryProvider` และ `StudentProvider`

### seed.ts — alumni upsert
`update` block ต้องมีทุก field เหมือน `create` (ยกเว้น `id` และ `employmentHistory`) เพื่อให้ re-seed อัปเดต record ที่มีอยู่แล้วได้ — ห้ามใช้ `update: {}` เปล่า

## AdminTable (`components/admin/ui/AdminTable.js`)

### `onCellClick` API
signature: `(e, i, j)` — event, row index, col index  
**caller ต้องจัดการ `e.stopPropagation()` เอง** — AdminTable ไม่ auto-stop  
ใช้เพื่อแยก checkbox column (j === 0) ออกจาก row click:
```js
onCellClick={(e, i, j) => {
  if (j === 0) { e.stopPropagation(); toggleSelect(paginated[i].id); }
}}
```

### Checkbox multi-select pattern
```js
// Header checkbox
<input
  type="checkbox"
  checked={allPageSelected}
  ref={(el) => { if (el) el.indeterminate = somePageSelected; }}
  onChange={toggleSelectPage}
  onClick={(e) => e.stopPropagation()}
/>
// Row checkbox — ใส่เป็น cell แรกใน rows array
<input
  type="checkbox"
  checked={selectedIds.has(item.id)}
  onChange={() => toggleSelect(item.id)}
  onClick={(e) => e.stopPropagation()}
/>
```

## UI Conventions
- **Sticky back bar** ใน detail pages: `<div className="sticky top-0 z-20 flex items-center border-b border-border bg-surface/95 px-6 py-2.5 backdrop-blur">` — มีทั้งใน student และ alumni detail
- **Action buttons**: ขนาด `h-8 w-8` icon `h-4 w-4` — ใช้ทั้ง student (`StudentActionButtons.js`) และ alumni list Actions column width `115px`
- **Filter persistence**: ใช้ `sessionStorage` เก็บ filter state ผ่าน `loadFilters()`/`saveFilters()` — session storage keys:
  | โมดูล | Key |
  |-------|-----|
  | Students | `student-list-filters` |
  | Alumni | `alumni-list-filters` |
  | Documents | `doc-list-filters` |
  | FAQ | `faq-list-filters` |
  | Companies | `company-list-filters` |
- **Sort options มาตรฐาน**: `newest` (createdAt desc), `oldest` (createdAt asc), `updated` (updatedAt desc), `th_az`/`th_za` (ชื่อไทย), เพิ่มเติมตามบริบท เช่น `year_desc`/`year_asc` สำหรับ alumni, `name-az`/`name-za`/`positions-desc` สำหรับ companies
- **Status pills count pattern**: count ใน pills ควร **นับจาก base list** (filter อื่นๆ ไว้แล้ว ยกเว้น filterStatus เอง) เพื่อให้ตัวเลขสะท้อนว่าแต่ละ status มีกี่รายการจากเงื่อนไขที่ filter ไว้อยู่ — ดูตัวอย่างใน `CompanyListClient.js` (IIFE `baseList`) และ `FaqListClient.js` (`statusCounts` useMemo)

### List page layout มาตรฐาน (ใช้ทุกโมดูล: News, FAQ, Documents, Job, Company, Mapping)
ลำดับ section ใน return ของ list client:
1. **Status pills** — `inline-flex` pill buttons กรองตามสถานะ พร้อม count badge และ dot สี เลือกแล้วมี `ring-2 ring-offset-1 ring-current`
2. **Search row** — `flex gap-2`: input `flex-1` + ปุ่มเสริม (ส่งออก/นำเข้า/เพิ่ม)
3. **Filter row** — `flex flex-wrap items-center gap-3`: label + select ทีละ filter (หมวดหมู่, สถานะ, เรียงลำดับ)
4. **Active filter chips** — แสดงเฉพาะเมื่อ `hasFilters` — chip `chipBase` ต่อ filter + ปุ่ม "ล้างทั้งหมด"
5. **Selection bar** — แสดงเมื่อเลือก ≥ 1 — count + ส่งออกที่เลือก + ยกเลิก
6. **Table** — `overflow-hidden rounded-2xl border border-border bg-surface`

Constants ที่ทุก list client ควรมี:
```js
const inputCls  = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const selectCls = "rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft";
const labelCls  = "text-xs font-medium text-foreground";
const chipBase  = "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors";
```

### Icon มาตรฐานสำหรับปุ่ม import/export (ทุกโมดูล)
ใช้ Heroicons 20px solid เหมือนกันทุกที่ — **ห้ามใช้ icon อื่น**:
```jsx
{/* Export (ส่งออก CSV) — arrow ชี้ขึ้น */}
<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
</svg>

{/* Import (นำเข้า CSV) — arrow ชี้ลง */}
<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
</svg>
```
Selection bar ใช้ `h-3.5 w-3.5` แทน `h-4 w-4` (เพราะปุ่มเล็กกว่า) — icon path เดิม
- **Timeline/ประวัติเรียงตามเวลา** (student enrollments, alumni employment history): แสดง **ล่าสุดอยู่บนสุด เก่าสุดอยู่ล่างสุด** เสมอ — ข้อมูลจริงใน state/DB ยังเก็บเรียงเก่า→ใหม่ตาม `order` เหมือนเดิม แค่ reverse ตอน render เท่านั้น ตัวเลข badge ให้นับตามลำดับเวลาจริง ไม่ใช่ตำแหน่งที่แสดงผล:
  ```js
  const displayed = [...items].reverse();
  {displayed.map((item, i) => <Card label={displayed.length - i} ... />)}
  ```
  ถ้ามี index จริงที่ต้องใช้ต่อ (เช่น onChange/onRemove ของฟอร์มแก้ไข) ให้ผูก index ไปกับ item ก่อน reverse แทนใช้ index ที่ได้จาก `.map()` หลัง reverse โดยตรง:
  ```js
  const displayed = items.map((item, i) => ({ item, i })).reverse();
  {displayed.map(({ item, i }) => <Card index={i} onChange={() => updateAt(i)} ... />)}
  ```

## AdminHeader (`components/admin/ui/AdminHeader.js`)
- แสดง page title (จาก `PageTitleContext`) ทางซ้าย + DB status pill + profile dropdown ทางขวา
- **DB status pill** — แสดง "สถานะฐานข้อมูล" พร้อม dot สี: 🟢 ปกติ / 🟡 กำลังตรวจสอบ / 🔴 ขัดข้อง
  - Hover → tooltip แสดง: สถานะ, latency, เวลาตรวจล่าสุด, ความถี่, legend 3 สถานะ + ปุ่มรีเฟรช
  - poll ทุก 60 วินาที — skip เมื่อ tab hidden (`document.hidden`), ตรวจทันทีเมื่อ tab กลับมา active (`visibilitychange`)
  - API: `GET /api/health` → `SELECT 1` ping DB คืน `{ ok: boolean, latency: number }`

## Context Providers
ทุก context ใน `components/admin/contexts/` ดึงข้อมูลจาก API แล้ว (ไม่ใช้ localStorage)
- ยกเว้น: `LanguageContext`, `PageTitleContext` (UI state เท่านั้น)
- `MappingContext` migrate จาก localStorage → `/api/mappings` แล้ว (ดู Marketplace section)
- Pattern: fetch **ทั้งตาราง** ครั้งเดียวตอน mount (`useEffect` ว่าง deps) เก็บใน state แล้ว filter/search/sort ฝั่ง client ทั้งหมด (ดู `StudentContext.js` + `StudentListClient.js`) — **เป็นการตัดสินใจตั้งใจ ไม่ใช่ bug**: วัดจริงที่ 100 students ≈ 143KB/25ms, ประมาณการที่ 1,000 students ≈ 1.4MB ยังรับได้สบายสำหรับ admin tool ภายใน ไม่ต้องรีบเปลี่ยนเป็น server-side search+pagination จนกว่าจะเกิน ~3,000-5,000 rows

## Admin Dashboard Pages

แต่ละ section ของ Admin มี dashboard page (`page.js`) ที่เป็น `"use client"` และดึงข้อมูลจาก Context โดยตรง:

| Page | Path | Contexts ที่ใช้ |
|------|------|----------------|
| Main Menu | `/admin/page.js` | students, companies, jobs, mappings, news, activities |
| Student Dashboard | `/admin/students/page.js` | students |
| Company Dashboard | `/admin/companies/page.js` | companies |
| Marketplace Dashboard | `/admin/marketplace/page.js` | jobs, mappings, companies |

### Dashboard layout มาตรฐาน (ใช้ทุก dashboard)
1. **Stat Cards** (`admin-stat-grid`) — 4 ตัวเลขหลัก
2. **Bar chart section** (grid 2 คอลัมน์) — `BarRow` component แสดง breakdown ตามหมวด
3. **Mini stat / highlight section** — `MiniStat` หรือ warning cards
4. **Top N list** — ranked bar list (top by positions, top by students ฯลฯ)
5. **Recent items (card grid)** — `card p-5 space-y-4` wrapper + `grid gap-2 sm:grid-cols-2 lg:grid-cols-3` — Link cards แสดงข้อมูลสำคัญ + status badge
6. **Quick links** — grid ลิงก์ไปยังหน้าย่อย

### BarRow component (ใช้ใน dashboard ทุกตัว)
```js
function BarRow({ label, count, total, colorClass, badge, unit = "รายการ", subLabel }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm gap-2">
        <div className="min-w-0">
          <span className="font-medium text-foreground truncate block">{label}</span>
          {subLabel && <span className="text-xs text-muted">{subLabel}</span>}
        </div>
        <span className="text-muted shrink-0 flex items-center gap-1.5">
          {badge && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge}`}>{pct}%</span>}
          <span className="text-xs font-semibold text-foreground">{count} {unit}</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
```

### goWithFilter pattern (dashboard → list page)
Dashboard ใช้ `sessionStorage` เพื่อส่ง filter ไปยัง list page:
```js
const goWithFilter = useCallback((overrides = {}) => {
  const saved = (() => { try { return JSON.parse(sessionStorage.getItem(FILTER_KEY)) ?? {}; } catch { return {}; } })();
  sessionStorage.setItem(FILTER_KEY, JSON.stringify({ ...saved, ...overrides }));
  router.push("/admin/students/list");
}, [router]);

// ใช้:
<button onClick={() => goWithFilter({ sortBy: "newest" })}>ดูทั้งหมด →</button>
```

## Companies (`/admin/companies/`)

### CompanyListClient.js — Filters
Filter ทั้งหมดที่รองรับ (เซฟใน `sessionStorage` key `company-list-filters`):
| Filter | State | ค่า Default |
|--------|-------|------------|
| Keyword chips | `keywords[]` | `[]` |
| Status | `filterStatus` | `"ทั้งหมด"` |
| Industry | `filterIndustry` | `"ทั้งหมด"` |
| Type (ประเภทนิติบุคคล) | `filterType` | `"ทั้งหมด"` |
| MOU | `filterMOU` | `"ทั้งหมด"` |
| Sort | `sortBy` | `"default"` |

Sort options: `default` / `newest` (createdAt desc) / `oldest` (createdAt asc) / `name-az` / `name-za` / `positions-desc` (เปิดรับมากสุด) / `updated` (updatedAt desc)

`hasFilter` = true เมื่อ keywords ≠ [] **หรือ** filter ใดๆ ≠ ค่า default (รวม `sortBy !== "default"`)

## Marketplace (`/admin/marketplace/`)

### Job Positions (`/api/jobs`, `JobListClient.js`)
- CRUD ผ่าน `JobContext` → `/api/jobs` + `/api/jobs/[id]`
- ID รูปแบบ `JOB-NNN` — **auto-generate** ในหน้าสร้างใหม่ (`nextJobId(jobs)` ใน `useMemo`) ผู้ใช้ไม่ต้องกรอกเอง
- ID **read-only** ในหน้าแก้ไข (ไม่สามารถเปลี่ยนได้)
- ตาราง `AdminTable` มีคอลัมน์: ☐ | ตำแหน่งงาน (200px) | สาขา (130px) | เงินเดือน (110px) | บริษัท/ที่ตั้ง (175px) | ประเภท/ระยะเวลา (120px) | สมัคร/รับ (96px) | ปิดรับ (102px) | สถานะ (108px) | จัดการ (115px)

### Applications — Mapping (`/api/mappings`, `MappingListClient.js`)
- ใช้ Prisma model **`JobApplication`** (table: `job_applications`)
- API: `GET/POST /api/mappings`, `GET/PUT/DELETE /api/mappings/[id]`
- ID รูปแบบ `MAP-NNN` — auto-generate ฝั่ง server
- `MappingContext` ดึงข้อมูลจาก API (migrate จาก localStorage แล้ว)
- ตาราง `AdminTable`: ☐ | นักเรียน (180px) | ตำแหน่งงาน (200px) | ประเภท/สาขา (140px) | วันที่สมัคร (110px) | สถานะ (170px) | จัดการ (115px)
- คอลัมน์นักเรียนแสดง: รหัส + ชื่อ + badge สถาบัน (สีแยก KMUTT/KMITL/Chulabhorn) + สาขา/ปี จาก enrollment ปัจจุบัน (`endDate == null`)
- **Sort options**: `newest` (createdAt desc), `oldest` (createdAt asc), `job-asc`/`job-desc` (ตำแหน่งงาน), `date-desc`/`date-asc` (appliedDate) — `newest`/`oldest` ใช้ `createdAt` ไม่ใช่ `appliedDate` (เพราะ appliedDate อาจเป็น null)
- **ปุ่มเพิ่ม** → navigate ไปหน้า `/admin/marketplace/applications/new` (ไม่ใช่ modal)
- **คลิกชื่อนักเรียน/ตำแหน่งงานในตาราง** → เข้าหน้า detail ของ mapping นั้น (ไม่ใช่ student/job page)

### Mapping Detail (`/admin/marketplace/applications/[id]`)
- Layout: hero card (preview live) → student card + job card (2-col grid) → details card (status/date/note)
- **edit mode**: student card และ job card มี SearchPicker เพื่อเปลี่ยนการ mapping — card ทั้งสองมี `min-h` คงขนาดไว้แม้ไม่มีข้อมูล
- **SearchPicker dropdown**: card ไม่มี `overflow-hidden` เพื่อกัน dropdown ถูกตัด — ใช้ `rounded-t-[...]` บน header แทน
- **สถานะนักเรียน**: แก้ไขได้เฉพาะตอน edit mode — กดปุ่มสถานะ = อัปเดต form state เท่านั้น, กด "บันทึก" ค่อย call `updateStudent` + บันทึก `StudentHistory`
- **ปุ่มคืนค่าเดิม**: อยู่ใน hero card (ขอบล่างชิดขวา) แสดงเมื่อ `editing === true`

### Mapping New (`/admin/marketplace/applications/new`)
- หน้าเต็มสำหรับสร้าง mapping ใหม่ (ไม่ใช่ modal)
- มี preview hero card + SearchPicker นักเรียน + SearchPicker ตำแหน่งงาน + status/date/note
- กด "บันทึก" → `addMapping()` แล้ว redirect ไปหน้า detail

## CSV Import/Export

### คอลัมน์บังคับแต่ละโมดูล

| โมดูล | คอลัมน์บังคับ | หมายเหตุ |
|-------|-------------|---------|
| Students | `nationalId` | จับคู่กับ record ที่มีอยู่ หรือสร้างใหม่ |
| Job Positions | `id`, `title` | |
| Applications | `studentId`, `jobId` | |
| Companies | `id`, `name` | กรองแถวที่ขาด id/name ออกอัตโนมัติ |

### Students CSV Headers (46 คอลัมน์)
`no.` `prefix` `name` `lastname` `prefixEn` `nameEn` `lastnameEn` `nickname` `gender` `dob` `nationalId` `passport` `militaryStatus`
`enroll1_university` `enroll1_studentId` `enroll1_email` `enroll1_faculty` `enroll1_department` `enroll1_major` `enroll1_year` `enroll1_advisor` `enroll1_project` (×3 ชุด: enroll1/2/3)
`prevSchool` `scholarship` `tel` `email` `lineId` `country`
`addr_th_houseNo` `addr_th_subdistrict` `addr_th_district` `addr_th_province` `addr_th_postalCode`
`addr_jp_postalCode` `addr_jp_prefecture` `addr_jp_city` `addr_jp_street` `addr_jp_building`
`departureDateTH` `arrivalDateJP` `status` `note`

### Applications CSV Export — คอลัมน์อ่านอย่างเดียว
Export มี `studentName`, `jobTitle`, `companyName` เพิ่มมาด้วย แต่ **import ไม่รับ** 3 คอลัมน์นี้ (เป็นแค่ข้อมูลอ้างอิง)

## Public Pages
`app/(public)/` — marketplace และ homepage ยังใช้ localStorage อยู่ (ยังไม่ได้ migrate)

## File Upload
- Banner: `POST /api/upload/banner` → เก็บที่ `public/banners/`
- Splash: `POST /api/upload/splash` → เก็บที่ `public/splash/`

## Banner (`/admin/information/banner`)

### Data flow — สำคัญมาก
`BannerContext` (admin) อ่าน/เขียน **PostgreSQL** ผ่าน `/api/banners`
`BannerSlider.tsx` (หน้าหลัก) อ่านจาก **localStorage** (`kosen_banners`)
→ ทั้งสองต้องตรงกัน: `BannerContext` จึง sync ลง localStorage ทุก operation (load/add/update/delete/reorder) ผ่าน `syncToLocalStorage()` ใน `BannerContext.js`

### Banner PUT — whitelist field
`PUT /api/banners/[id]` ต้องกรอง field ด้วย `BANNER_FIELDS` array ก่อนส่ง Prisma
เหมือน Student PUT — form ตอน edit มี `createdAt`, `updatedAt`, `id`, relation fields ติดมา → Prisma reject
```js
const BANNER_FIELDS = [
  "layout", "eyebrow", "headline", "body", "badge",
  "newsId", "activityId", "ctaLabel", "ctaHref",
  "secondaryLabel", "secondaryHref", "image", "imagePosition",
  "textSize", "textAlign", "status", "order",
];
const data = Object.fromEntries(
  BANNER_FIELDS.filter((k) => k in body).map((k) => [k, body[k]])
);
```

### Preview (AllBannersPreviewModal)
- แสดงเฉพาะ banner ที่ `status === "active"` เหมือนหน้าหลักจริง
- กด ‹ › หรือ ← → keyboard เพื่อเปลี่ยน slide, Esc ปิด
- Dots ด้านล่าง กดได้
- ปุ่ม "พรีวิว" บนแต่ละ card เปิด slider ที่ slide นั้นเลย
- ปุ่ม "พรีวิวทั้งหมด" ใน toolbar เปิดที่ slide แรก

### Preview vs หน้าหลัก — ให้ตรงกัน
`BannerSlide` (preview) และ `HeroContent` ใน `BannerSlider.tsx` ต้องใช้ class เดียวกันทุกจุด:
- Container: `w-full` (ไม่ใช่ `max-w-2xl`) — text เต็มแบนเนอร์
- Layout: `page-container w-full pb-16` + `z-10` สำหรับ content wrapper
- news-single: `<div className="w-full">` ห่อ content, `<div className="min-w-0">` ห่อ h1 (ไม่มี `flex-1`)
- Arrows: `h-14 w-14 text-3xl` hover สีขาว → primary
- Dots: `bottom-4`, `h-3 w-8 bg-white` active, `h-3 w-3 bg-white/40` inactive
- Animation: 400ms `translate-x-4 opacity-0` → `translate-x-0 opacity-100`

## FAQ (`/admin/information/faq`)
- CRUD ผ่าน `FaqContext` → `/api/faq`
- ID รูปแบบ `FAQ001`, `FAQ002`, ... — auto-generate ฝั่ง client (`nextId(faqs)`)
- ตาราง: ☐ | ลำดับ (▲▼ reorder) | คำถาม / คำตอบ | หมวดหมู่ | สถานะ | จัดการ
- **คำตอบแสดงตรงในตาราง** (ไม่ต้องกด) — `line-clamp-4 whitespace-pre-wrap text-xs text-muted`
- Status pills: ทั้งหมด / เผยแพร่ / แบบร่าง — count นับจาก `statusCounts` useMemo ที่ respect filterCat + search แต่ไม่ filter status ตัวเอง
- Filter: หมวดหมู่ dropdown เท่านั้น (ไม่มี sort dropdown เพราะลำดับมาจาก manual reorder)
- `sessionStorage` key: `faq-list-filters` (ยังไม่ได้ implement — TODO)
- Import CSV: `question`, `answer` บังคับ — รองรับ merge/replace mode
- Export CSV: columns `id`, `question`, `answer`, `category`, `status`, `order`

## Documents (`/admin/information/documents`)
- CRUD ผ่าน `DocumentContext` → `/api/documents`
- ID รูปแบบ `D001`, `D002`, ... — auto-generate
- Status: `published` | `scheduled` | `draft` — `effectiveStatus()` ดูวันที่เผยแพร่ด้วย
- `formatDateTime` จาก `lib/utils/newsUtils` — ใช้แสดงวันที่เหมือน News (ไม่ใช่ `toThaiDateTime` custom)
- Filter: หมวดหมู่ + ชนิดไฟล์ (`FILE_TYPES` จาก `lib/data/documentsData`) + สถานะ + เรียงลำดับ
- `sessionStorage` key: `doc-list-filters`

## Splash Config (`/admin/information/splash`, `SplashConfigClient.js`)
- Config เดียวใน DB (`SplashConfig` model) — `GET/PUT /api/splash`
- **Prisma enum radius**: `r2xl` (`@map("2xl")`), `r3xl` (`@map("3xl")`) — UI ส่ง `"2xl"`/`"3xl"` ตรงๆ → API แปลงด้วย `RADIUS_TO_PRISMA` ก่อนบันทึก, แปลงกลับด้วย `RADIUS_FROM_PRISMA` ใน `toClient()` ก่อน return
- **Field whitelist**: `PUT /api/splash` ใช้ `SPLASH_FIELDS` array กรองก่อนส่ง Prisma (เหมือน Banner)
- **Layout**: 2 คอลัมน์ `grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]` — ซ้าย settings, ขวา sticky preview
- **Interactive preview**: ปุ่ม drag handle เปลี่ยน width (sm/md/lg snap ทุก 80px), badge วนเปลี่ยน radius
- **Delay**: เก็บใน DB หน่วย ms (`delayMs`) แต่ UI แสดง/รับหน่วย วินาที — slider `min=0 max=3 step=0.5`, `onChange: v * 1000`
- **Library tab**: thumbnail `grid-cols-5 gap-1.5 aspect-square` — ไม่มี mini strip preview แยก (แสดงเส้น path text เท่านั้น)
- **Rules of Hooks**: ทุก `useState`/`useRef`/`useEffect` ต้องอยู่ก่อน `if (!ready || !form) return` เสมอ

## E2E Tests (Playwright)

ไฟล์อยู่ที่ `e2e/tests/` — รวม **321 tests | 319 passed | 2 flaky** (11-mapping-ui-crud — ผ่านเมื่อรันแยก)

### Coverage สรุป
- **Backend API**: 43/47 routes ✅ (91%) — ขาดเฉพาะ Upload APIs (multipart, intentional)
- **Frontend UI**: ครบทุก module ที่ implement แล้ว — stub pages มี smoke test (navigate ไม่ crash)
- **ที่ยังขาด**: `/admin/marketplace/job-positions/new` (full-page form) + Upload APIs

### ตารางไฟล์ทั้งหมด

#### API Tests
| ไฟล์ | โมดูล | เคส | ครอบคลุม |
|------|-------|-----|---------|
| `02-student-api` | Student API | 7 | CRUD + edge cases |
| `04-faq-api` | FAQ API | 8 | CRUD + BVA |
| `05-news-api` | News API | 6 | CRUD |
| `16-company-api` | Company API | 7 | CRUD + dup 409 |
| `17-job-api` | Job API | 8 | CRUD + status filter |
| `18-mapping-api` | Mapping API | 8 | CRUD + missing field 400 |
| `19-alumni-api` | Alumni API | 8 | CRUD + employmentHistory |
| `20-document-api` | Document API | 8 | CRUD + status filter |
| `21-banner-api` | Banner API | 8 | CRUD + newsId null safe |
| `31-news-categories-api` | News Categories API | 4 | GET/POST |
| `32-scholarship-types-api` | Scholarship Types API | 5 | CRUD ครบ |
| `33-activities-api` | Activities API | 6 | CRUD + blocks + status filter |
| `34-splash-api` | Splash API | 5 | GET/PUT + radius mapping + whitelist |
| `35-users-api` | Users API | 6 | CRUD + bcrypt + no password leak |
| `36-internships-api` | Internships API | 6 | CRUD + studentId filter |
| `40-contact-apis` | Contact APIs (3 กลุ่ม) | 15 | contact-info/social/universities CRUD + reorder |
| `41-history-apis` | History APIs | 10 | student-history + alumni-history GET/POST/DELETE |
| `42-news-categories-id-api` | News Categories [id] | 4 | PUT + DELETE |

#### UI Tests
| ไฟล์ | โมดูล | เคส | ครอบคลุม |
|------|-------|-----|---------|
| `01-auth` | Login/Logout | 5 | auth flow |
| `03-student-ui` | Student UI smoke | 4 | navigation |
| `06-student-ui-crud` | Students UI | 9 | Create/Search/Edit/Delete |
| `07-faq-ui-crud` | FAQ UI | 8 | Create/Search/Edit/Delete |
| `08-news-ui-crud` | News UI | 7 | Create/Search/Edit/Delete |
| `09-company-ui-crud` | Companies UI | 8 | Create/Search/Edit/Delete |
| `10-job-ui-crud` | Job Positions UI | 8 | Create/Search/Edit/Delete |
| `11-mapping-ui-crud` | Applications UI | 10 | Create/Search/Edit/Delete |
| `12-alumni-ui-crud` | Alumni UI | 8 | Create/Search/Edit/Delete |
| `13-document-ui-crud` | Documents UI | 9 | Create/Search/Edit/Delete |
| `14-banner-ui-crud` | Banner UI | 12 | Create/Edit/Delete + preview |
| `15-splash-ui-config` | Splash Config UI | 8 | toggle/update/persist |
| `22-faq-reorder` | FAQ reorder | 4 | ▲▼ + PATCH /api/faq/reorder |
| `23-banner-reorder` | Banner reorder | 4 | ↑↓ + PATCH /api/banners/reorder |
| `24-company-detail` | Company detail page | 5 | navigate/edit/cancel/save/auto-edit |
| `25-job-detail` | Job detail page | 5 | navigate/edit/cancel/save/auto-edit |
| `26-application-detail` | Application detail | 5 | navigate/edit/cancel/save/status grid |
| `27-student-detail` | Student detail | 5 | navigate/edit/cancel/save/auto-edit |
| `28-alumni-detail` | Alumni detail | 5 | navigate/edit/cancel/save/history section |
| `29-csv-export` | CSV export | 5 | download event — Students/Companies/FAQ/Jobs/Apps |
| `30-csv-import` | CSV import | 4 | FAQ/Companies/Jobs + non-csv error case |
| `37-student-new-page` | Student new page | 4 | navigate/submit disabled/create/redirect |
| `38-alumni-new-page` | Alumni new page | 4 | navigate/submit disabled/create/redirect |
| `39-stub-pages-smoke` | Stub pages smoke | 9 | 9 หน้า 🔧 — navigate ไม่ crash |

### Pattern สำคัญใน UI tests
- **ใช้ ASCII เท่านั้นสำหรับ dynamic test data** — `fill()` กับ Thai text ใน Chromium อาจ hang เมื่อ input มี character filter (`onlyThai`, `onlyEnglish` ฯลฯ)
- **`waitForResponse` + `Promise.all`** — ใช้ดัก POST/PUT/DELETE ที่ context ไม่ await ก่อน assert
- **Modal scoping** — `page.locator(".fixed.inset-0.z-50").last()` เพื่อหลีกเลี่ยง strict mode เมื่อมีปุ่มชื่อซ้ำ
- **Live search filter** — ทุก list module กรอง `searchInput` แบบ live (ไม่ต้องกด Enter) ยกเว้น keyword chips
- **Banner page** — ห้ามใช้ `waitForLoadState("networkidle")` เพราะ BannerContext fetch News ค้างอยู่เสมอ — ใช้ `expect(button).toBeVisible()` แทน
- **Banner card scoping** — `page.locator("div").filter({ hasText, has: getByRole("button", { name: "แก้ไข" }) }).last()` ได้ card ระดับใน
- **Alumni `AlumniEmploymentHistory`** — ไม่มี field `startYear`; ใช้ `startDate`/`endDate` (VarChar 10 string)
- **Detail pages** — ชื่อ/title ปรากฏ 2 ครั้ง (sticky bar + form/card) → ใช้ `.first()` เสมอ
- **Strict mode กับ getByPlaceholder** — Playwright match แบบ partial ดังนั้น `getByPlaceholder('2565')` จะ match `placeholder="2565-06"` ด้วย → ใช้ `page.locator('input[placeholder="2565"]')` เมื่อต้องการ exact
- **CSV import confirm buttons** — FAQ/Jobs ใช้ `/รวม \d+ รายการ|แทนที่ด้วย \d+/`, Companies ใช้ `/นำเข้า \d+ บริษัท/` — ต้อง scope ไปยัง modal `.fixed.inset-0.z-50` ก่อนเพื่อกัน toolbar button

### Bugs พบระหว่าง test และ fix แล้ว
- `app/api/news/route.js` + `[id]/route.js` — map `author` (form) → `authorName` (Prisma), strip relations
- `app/api/jobs/[id]/route.js` — เพิ่ม `JOB_FIELDS` whitelist กรอง `company` relation ออกก่อน PUT
- `components/admin/FaqListClient.js` — null-safe `category` ใน `matchFaq` (กัน crash เมื่อ category เป็น null)
- `app/api/banners/route.js` + `[id]/route.js` — `normalizeRelations()` แปลง `newsId`/`activityId` `""` → `null` ก่อนส่ง Prisma (กัน P2003)
- `app/api/alumni/route.js` — migrate จาก bare `try/catch` → `withErrorHandler` (P2002 dup → 409 แทน 500)
- `app/api/activities/route.js` + `[id]/route.js` — เพิ่ม `blockId()` + `prepBlocks()` (เหมือน News) กัน Prisma error "id is missing" ตอน create blocks
- `app/admin/marketplace/applications/[id]/page.js` — ย้าย `useMemo` ขึ้นก่อน early return (Rules of Hooks)
- `StudentHistory.changedBy` — FK → User (ต้องส่ง `null` หรือ user id จริง — ไม่ใช่ string ทั่วไป); `AlumniHistory.changedBy` ไม่มี FK (ส่ง string อะไรก็ได้)

## ยังไม่ได้ทำ (Remaining)
- API Authentication (ทุก route ยังไม่ได้ protect)
- Role-based access control
- Input validation (Zod)
- Error handling ครบทุก route — routes ต่อไปนี้ยังใช้ bare `try/catch` แทน `withErrorHandler`:
  `students`, `students/[id]`, `mappings`, `mappings/[id]`, `banners/[id]`, `alumni/[id]`, `companies/[id]`, `splash`, `news-categories`, `news-categories/[id]`, `alumni-history`, upload routes (3 ตัว)
- Public pages migrate จาก localStorage → API (marketplace, homepage — ยกเว้น login ที่เก็บ username จงใจ)
- UI implement จริง สำหรับ stub pages 🔧 ที่ยังไม่มี Client Component เลย: Activities, Students Documents, Academic Tracking, Scholarship
- UI implement จริง สำหรับ stub pages 🔧 ที่มี Client Component แล้วแต่ยังไม่สมบูรณ์: News Categories, Scholarship Types, Contact, Internship Tracking, Users
- E2E test: `/admin/marketplace/job-positions/new` (full-page form) + Upload APIs (multipart)
