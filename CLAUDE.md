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
- Login: username + password (bcryptjs hash)
- Session: JWT
- Admin credentials ปัจจุบัน: `admin` / `admin` (superadmin)
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

### Student PUT — enrollment id
ตอน create enrollment ใหม่ ต้อง strip `id` และ `studentId` ออกก่อน:
```js
{ create: enrollments.map(({ id: _id, studentId: _sid, ...e }) => e) }
```

### News/Activities PUT — blocks
ต้อง delete blocks เก่าก่อน แล้ว create ใหม่ใน `$transaction`
Strip `id` จาก blocks ก่อน create เช่นกัน

## Database
- DB name: `kosen_eportal`
- Local: `postgresql://localhost:5432/kosen_eportal`
- Seed: `npm run seed`
- Reset + seed: `npx prisma migrate reset --skip-seed && npm run seed`

## Git Branches
- `main` → localStorage version (Vercel deploy)
- `dev` → PostgreSQL version (พัฒนาต่อบนนี้)

## Environment Variables (.env)
```
DATABASE_URL="postgresql://localhost:5432/kosen_eportal"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

## Commands
```bash
npm run dev          # รัน dev server
npm run build        # build
npm run seed         # seed ข้อมูล
npx prisma studio    # ดูข้อมูลใน browser
npx prisma migrate dev --name <name>  # สร้าง migration ใหม่
npx prisma generate  # regenerate client หลังแก้ schema
```

## Context Providers
ทุก context ใน `components/admin/contexts/` ดึงข้อมูลจาก API แล้ว (ไม่ใช้ localStorage)
- ยกเว้น: `MappingContext`, `LanguageContext`, `PageTitleContext` (UI state เท่านั้น)

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
