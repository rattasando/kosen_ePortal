@AGENTS.md

# KOSEN ePortal — Project Guide

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
- `dev` → PostgreSQL version (พัฒนาต่อบนนี้)

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
```

## Shared Utilities (`lib/utils/`)
- `inputFilters.js` — character-class filters (`onlyThai`, `onlyEnglish`, `onlyNumeric`, `onlyAscii`, `onlyThaiText`, `onlyEnglishAddress`) ใช้กรอง input ตอน `onChange` ให้ตรงประเภทข้อมูล (ไทย/อังกฤษ/ตัวเลข) + auto-formatter ใส่ขีดให้อัตโนมัติ (`formatThaiPhone`, `formatThaiNationalId`, `formatThaiBankAccount`)
- `studentFieldLimits.js` — map ความยาว `@db.VarChar(n)` ของ Student/StudentEnrollment ไว้ validate ฝั่ง API ก่อนถึง Prisma (กัน error "value too long" ที่บางทีไม่บอกชื่อ column)
- `studentEnrollments.js` — `prepEnrollments()` ใช้ร่วมกันทั้ง POST/PUT: บังคับ `order` ตามตำแหน่งใน array + แปลง `startDate`/`endDate` เป็น Date object
- `studentHistoryHelpers.js` — `diffSnapshot()` เทียบ before/after เพื่อ log ประวัติแก้ไขนักเรียน — **ระวัง**: `before`/`after` ต้องมี shape ตรงกันเป๊ะ ไม่งั้นเกิด diff ปลอม (ดู Known Bugs Fixed)

## UI Conventions
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

## Context Providers
ทุก context ใน `components/admin/contexts/` ดึงข้อมูลจาก API แล้ว (ไม่ใช้ localStorage)
- ยกเว้น: `MappingContext`, `LanguageContext`, `PageTitleContext` (UI state เท่านั้น)
- Pattern: fetch **ทั้งตาราง** ครั้งเดียวตอน mount (`useEffect` ว่าง deps) เก็บใน state แล้ว filter/search/sort ฝั่ง client ทั้งหมด (ดู `StudentContext.js` + `StudentListClient.js`) — **เป็นการตัดสินใจตั้งใจ ไม่ใช่ bug**: วัดจริงที่ 100 students ≈ 143KB/25ms, ประมาณการที่ 1,000 students ≈ 1.4MB ยังรับได้สบายสำหรับ admin tool ภายใน ไม่ต้องรีบเปลี่ยนเป็น server-side search+pagination จนกว่าจะเกิน ~3,000-5,000 rows

## Public Pages
`app/(public)/` — marketplace และ homepage ยังใช้ localStorage อยู่ (ยังไม่ได้ migrate)

## File Upload
- Banner: `POST /api/upload/banner` → เก็บที่ `public/banners/`
- Splash: `POST /api/upload/splash` → เก็บที่ `public/splash/`

## ยังไม่ได้ทำ (Remaining)
- API Authentication (ทุก route ยังไม่ได้ protect)
- Role-based access control
- Input validation (Zod)
- Error handling ครบทุก route (มีแค่บางส่วน)
- Public pages migrate จาก localStorage → API
