import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client.ts";
import bcrypt from "bcryptjs";
import { DEFAULT_USERS } from "../lib/data/userData.js";
import { DEFAULT_SCHOLARSHIP_TYPES } from "../lib/data/scholarshipTypesData.js";
import { DEFAULT_STUDENTS } from "../lib/data/studentData.js";
import { DEFAULT_NEWS } from "../lib/data/newsData.js";
import { DEFAULT_BANNERS } from "../lib/data/bannerData.js";
import { ALUMNI } from "../lib/data/alumniData.js";
import { DEFAULT_SPLASH } from "../lib/data/splashData.js";
import {
  DEFAULT_CONTACT_MAIN,
  DEFAULT_CONTACT_UNIVERSITIES,
  DEFAULT_CONTACT_SOCIAL,
} from "../lib/data/contactData.js";
import { DEFAULT_FAQS } from "../lib/data/faqData.js";
import { DEFAULT_DOCUMENTS } from "../lib/data/documentsData.js";
import { DEFAULT_COMPANIES } from "../lib/data/companyData.js";
import { DEFAULT_JOBS } from "../lib/data/jobData.js";
import { DEFAULT_MAPPINGS } from "../lib/data/mappingData.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Map scholarship name → ID
const SCHOLARSHIP_NAME_TO_ID = {
  "ทุน 2 ปี": "SCH001",
  "ทุน 3 ปี": "SCH002",
  "ทุน 5 ปี": "SCH003",
  "ทุน จภ.": "SCH004",
};

// Convert banner layout string to Prisma enum name
function mapBannerLayout(layout) {
  if (layout === "news-single") return "news_single";
  if (layout === "activity-single") return "activity_single";
  return layout;
}

// Safely parse Date — returns null if invalid/empty
function toDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

// ─────────────────────────────────────────────────────────────
// 1. Users
// ─────────────────────────────────────────────────────────────
async function seedUsers() {
  console.log("Seeding users...");
  for (const u of DEFAULT_USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        username: u.username,
        password: hashed,
        passwordUpdatedAt: toDate(u.passwordUpdatedAt),
        name: u.name,
        nameEn: u.nameEn ?? null,
        email: u.email,
        role: u.role,
        department: u.department ?? null,
        university: u.university ?? null,
        tel: u.tel ?? null,
        lastLogin: toDate(u.lastLogin),
        status: u.status,
        note: u.note ?? null,
        createdAt: toDate(u.createdAt) ?? new Date(),
      },
    });
  }
  console.log(`  ✓ ${DEFAULT_USERS.length} users`);
}

// ─────────────────────────────────────────────────────────────
// 2. ScholarshipTypes
// ─────────────────────────────────────────────────────────────
async function seedScholarshipTypes() {
  console.log("Seeding scholarship types...");
  for (const t of DEFAULT_SCHOLARSHIP_TYPES) {
    await prisma.scholarshipType.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        slug: t.slug,
        name: t.name,
        icon: t.icon ?? null,
        coverage: t.coverage ?? null,
        valuePerSem: t.valuePerSem ?? null,
        valueTotal: t.valueTotal ?? null,
        count: t.count ?? 0,
        featured: t.featured ?? false,
        criteria: t.criteria ?? null,
        benefits: t.benefits ?? null,
        note: t.note ?? null,
        status: t.status ?? "active",
        order: t.order ?? 0,
        createdAt: toDate(t.createdAt) ?? new Date(),
      },
    });
  }
  console.log(`  ✓ ${DEFAULT_SCHOLARSHIP_TYPES.length} scholarship types`);
}

// ─────────────────────────────────────────────────────────────
// 3. Students (with enrollments)
// ─────────────────────────────────────────────────────────────
async function seedStudents() {
  console.log("Seeding students...");
  // Clear existing data (cascade removes enrollments/history/etc.)
  await prisma.studentHistory.deleteMany();
  await prisma.studentActivity.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.internship.deleteMany();
  await prisma.studentEnrollment.deleteMany();
  await prisma.student.deleteMany();

  let count = 0;

  // Deduplicate nationalIds (test data has some duplicates)
  const seenIds = new Set<string>();
  const students = DEFAULT_STUDENTS.map((s: any) => {
    if (s.nationalId && seenIds.has(s.nationalId)) {
      return { ...s, nationalId: null };
    }
    if (s.nationalId) seenIds.add(s.nationalId);
    return s;
  });

  for (const s of students) {
    const { enrollments, addresses, ...rest } = s;

    const th = addresses?.th ?? {};
    const jp = addresses?.jp ?? {};

    try {
    await prisma.student.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        prefix: rest.prefix ?? null,
        prefixEn: rest.prefixEn ?? null,
        name: rest.name,
        nameEn: rest.nameEn ?? null,
        lastname: rest.lastname,
        lastnameEn: rest.lastnameEn ?? null,
        nickname: rest.nickname ?? null,
        gender: rest.gender ?? null,
        dob: toDate(rest.dob),
        nationalId: rest.nationalId || null,
        passport: rest.passport ?? null,
        militaryStatus: rest.militaryStatus ?? null,
        tel: rest.tel ?? null,
        email: rest.email ?? null,
        lineId: rest.lineId ?? null,
        country: rest.country ?? "ไทย",
        addrThHouseNo: th.houseNo ?? null,
        addrThSubdistrict: th.subdistrict ?? null,
        addrThDistrict: th.district ?? null,
        addrThProvince: th.province ?? null,
        addrThPostalCode: th.postalCode ?? null,
        addrJpPostalCode: jp.postalCode ?? null,
        addrJpPrefecture: jp.prefecture ?? null,
        addrJpCity: jp.city ?? null,
        addrJpStreetAddress: jp.streetAddress ?? null,
        addrJpBuilding: jp.building ?? null,
        prevSchool: rest.prevSchool ?? null,
        scholarship: rest.scholarship ?? null,
        scholarshipTypeId: SCHOLARSHIP_NAME_TO_ID[rest.scholarship] ?? null,
        departureDateTh: toDate(rest.departureDateTh),
        arrivalDateJp: toDate(rest.arrivalDateJp),
        status: rest.status ?? "กำลังศึกษา",
        note: rest.note ?? null,
        avatar: rest.avatar ?? null,
        createdAt: toDate(rest.createdAt) ?? new Date(),
        enrollments: enrollments?.length
          ? {
              create: enrollments.map((e, i) => ({
                order: i + 1,
                university: e.university ?? "",
                studentNo: e.studentId ?? null,
                univEmail: e.univEmail ?? null,
                faculty: e.faculty ?? null,
                department: e.department ?? null,
                major: e.major ?? null,
                year: e.year != null ? String(e.year) : null,
                advisor: e.advisor ?? null,
                project: e.project ?? null,
              })),
            }
          : undefined,
      },
    });
    count++;
    } catch (e: any) {
      console.error(`  ✗ Failed ${s.id} (nationalId=${rest.nationalId}):`, e.message);
    }
  }
  console.log(`  ✓ ${count} students`);
}

// ─────────────────────────────────────────────────────────────
// 4. News Categories
// ─────────────────────────────────────────────────────────────
async function seedNewsCategories() {
  console.log("Seeding news categories...");
  const categories = [
    { id: "CAT-001", name: "ความร่วมมือ",       color: "bg-blue-100 text-blue-700",     order: 1 },
    { id: "CAT-002", name: "กิจกรรม",            color: "bg-violet-100 text-violet-700",  order: 2 },
    { id: "CAT-003", name: "ทุนการศึกษา",        color: "bg-yellow-100 text-yellow-700",  order: 3 },
    { id: "CAT-004", name: "ประกาศ",             color: "bg-slate-100 text-slate-700",    order: 4 },
    { id: "CAT-005", name: "ความสำเร็จ",         color: "bg-teal-100 text-teal-700",      order: 5 },
    { id: "CAT-006", name: "โครงการแลกเปลี่ยน",  color: "bg-rose-100 text-rose-700",      order: 6 },
  ];
  for (const cat of categories) {
    await (prisma as any).newsCategory.upsert({
      where: { id: cat.id },
      update: { name: cat.name, color: cat.color, order: cat.order },
      create: cat,
    });
  }
  console.log(`  ✓ ${categories.length} news categories`);
}

// ─────────────────────────────────────────────────────────────
// 5. News (with blocks)
// ─────────────────────────────────────────────────────────────
async function seedNews() {
  console.log("Seeding news...");
  for (const n of DEFAULT_NEWS) {
    const { blocks, author, authorId, ...rest } = n;
    await prisma.news.upsert({
      where: { id: n.id },
      update: {},
      create: {
        id: n.id,
        title: n.title,
        slug: n.slug ?? null,
        category: n.category ?? null,
        catColor: n.catColor ?? null,
        excerpt: n.excerpt ?? null,
        image: n.image ?? null,
        authorId: authorId ?? null,
        authorName: author ?? null,
        tags: n.tags ?? null,
        status: n.status ?? "draft",
        featured: n.featured === true || n.featured === 1,
        publishedAt: toDate(n.publishedAt),
        heroAspect: n.heroAspect ?? "21/9",
        imagePosition: n.imagePosition ?? "center",
        views: n.views ?? 0,
        createdAt: toDate(n.createdAt) ?? new Date(),
        blocks: blocks?.length
          ? {
              create: blocks.map((b, i) => ({
                id: `${n.id}B${i}`,
                order: b.order ?? i,
                type: b.type,
                content: b.content ?? null,
                src: b.src ?? null,
                alt: b.alt ?? null,
                caption: b.caption ?? null,
                fontSize: b.fontSize ?? "base",
                imageSize: b.imageSize ?? "16/9",
                objectPosition: b.objectPosition ?? "center",
              })),
            }
          : undefined,
      },
    });
  }
  console.log(`  ✓ ${DEFAULT_NEWS.length} news`);
}

// ─────────────────────────────────────────────────────────────
// 5. Banners
// ─────────────────────────────────────────────────────────────
async function seedBanners() {
  console.log("Seeding banners...");
  for (const b of DEFAULT_BANNERS) {
    await prisma.banner.upsert({
      where: { id: b.id },
      update: {},
      create: {
        id: b.id,
        layout: mapBannerLayout(b.layout),
        eyebrow: b.eyebrow ?? null,
        headline: b.headline ?? null,
        body: b.body ?? null,
        badge: b.badge ?? null,
        newsId: b.newsId ?? null,
        activityId: b.activityId ?? null,
        ctaLabel: b.ctaLabel ?? null,
        ctaHref: b.ctaHref ?? null,
        secondaryLabel: b.secondaryLabel ?? null,
        secondaryHref: b.secondaryHref ?? null,
        image: b.image ?? null,
        imagePosition: b.imagePosition ?? "center",
        textSize: b.textSize ?? null,
        textAlign: b.textAlign ?? null,
        status: b.status ?? "active",
        order: b.order ?? 0,
      },
    });
  }
  console.log(`  ✓ ${DEFAULT_BANNERS.length} banners`);
}

// ─────────────────────────────────────────────────────────────
// 6. Alumni (with employment history)
// ─────────────────────────────────────────────────────────────
async function seedAlumni() {
  console.log("Seeding alumni...");
  for (const a of ALUMNI) {
    const { employmentHistory, ...rest } = a;

    // Find scholarshipTypeId from scholarshipYears count
    let scholarshipTypeId = null;
    if (rest.scholarshipYears === 2) scholarshipTypeId = "SCH001";
    else if (rest.scholarshipYears === 3) scholarshipTypeId = "SCH002";
    else if (rest.scholarshipYears === 5) scholarshipTypeId = "SCH003";

    const alumniData = {
      studentId: rest.studentId ?? null,
      prefix: rest.prefix ?? null,
      name: rest.name,
      lastname: rest.lastname,
      nameEn: (rest as any).nameEn ?? null,
      lastnameEn: (rest as any).lastnameEn ?? null,
      nickname: rest.nickname ?? null,
      graduatedYear: rest.graduatedYear ?? null,
      major: rest.major ?? null,
      university: rest.university ?? null,
      scholarshipTypeId,
      scholarshipYears: rest.scholarshipYears ?? null,
      scholarshipStatus: rest.scholarshipStatus ?? null,
      contact: rest.contact ?? null,
      phone: rest.phone ?? null,
      remark: rest.remark ?? null,
    };
    await prisma.alumni.upsert({
      where: { id: a.id },
      update: alumniData,
      create: {
        id: a.id,
        ...alumniData,
        employmentHistory: employmentHistory?.length
          ? { create: employmentHistory }
          : undefined,
      },
    });
  }
  console.log(`  ✓ ${ALUMNI.length} alumni`);
}

// ─────────────────────────────────────────────────────────────
// 7. Splash config
// ─────────────────────────────────────────────────────────────
async function seedSplash() {
  console.log("Seeding splash config...");
  const s = DEFAULT_SPLASH;
  const existing = await prisma.splashConfig.findFirst();
  if (!existing) {
    await prisma.splashConfig.create({
      data: {
        enabled: s.enabled ?? false,
        image: s.image ?? null,
        title: s.title ?? null,
        body: s.body ?? null,
        ctaLabel: s.ctaLabel ?? null,
        ctaHref: s.ctaHref ?? null,
        showFrequency: s.showFrequency ?? "always",
        delayMs: s.delayMs ?? 500,
        width: s.width ?? "md",
        border: s.border ?? true,
        radius: s.radius ?? "none",
      },
    });
  }
  console.log("  ✓ splash config");
}

// ─────────────────────────────────────────────────────────────
// 8. Contact info & universities
// ─────────────────────────────────────────────────────────────
async function seedContact() {
  console.log("Seeding contact info...");
  for (const c of DEFAULT_CONTACT_MAIN) {
    await prisma.contactInfo.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        icon: c.icon ?? null,
        label: c.label,
        lines: c.lines,
        href: c.href ?? null,
        order: c.order ?? 0,
      },
    });
  }
  console.log(`  ✓ ${DEFAULT_CONTACT_MAIN.length} contact items`);

  for (const u of DEFAULT_CONTACT_UNIVERSITIES) {
    await prisma.contactUniversity.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        name: u.name,
        fullName: u.fullName ?? u.name,
        location: u.location ?? null,
        phone: u.phone ?? null,
        email: u.email ?? null,
        mapUrl: u.mapUrl ?? null,
      },
    });
  }
  console.log(`  ✓ ${DEFAULT_CONTACT_UNIVERSITIES.length} universities`);

  for (const s of DEFAULT_CONTACT_SOCIAL) {
    await prisma.contactSocial.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        icon: s.icon ?? null,
        label: s.label,
        handle: s.handle ?? null,
        href: s.href ?? null,
        order: s.order ?? 0,
      },
    });
  }
  console.log(`  ✓ ${DEFAULT_CONTACT_SOCIAL.length} social links`);
}

// ─────────────────────────────────────────────────────────────
// 9. FAQ
// ─────────────────────────────────────────────────────────────
async function seedFaq() {
  console.log("Seeding FAQ...");
  for (const f of DEFAULT_FAQS) {
    await prisma.faq.upsert({
      where: { id: f.id },
      update: {},
      create: {
        id: f.id,
        question: f.question,
        answer: f.answer,
        category: f.category ?? null,
        order: f.order ?? 0,
        status: f.status ?? "published",
        createdAt: toDate(f.createdAt) ?? new Date(),
      },
    });
  }
  console.log(`  ✓ ${DEFAULT_FAQS.length} FAQs`);
}

// ─────────────────────────────────────────────────────────────
// 10. Documents
// ─────────────────────────────────────────────────────────────
async function seedDocuments() {
  console.log("Seeding documents...");
  for (const d of DEFAULT_DOCUMENTS) {
    await prisma.document.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id,
        category: d.category ?? null,
        title: d.title,
        description: d.description ?? null,
        rawDate: toDate(d.rawDate ?? d.date),
        fileType: d.fileType ?? null,
        fileSize: d.fileSize ?? null,
        fileUrl: d.fileUrl ?? null,
        isNew: d.isNew ?? false,
        status: d.status ?? "published",
        createdAt: toDate(d.createdAt) ?? new Date(),
      },
    });
  }
  console.log(`  ✓ ${DEFAULT_DOCUMENTS.length} documents`);
}

// ─────────────────────────────────────────────────────────────
// 11. Companies
// ─────────────────────────────────────────────────────────────
async function seedCompanies() {
  console.log("Seeding companies...");
  for (const c of DEFAULT_COMPANIES) {
    await prisma.company.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        name: c.name,
        nameEn: c.nameEn ?? null,
        industry: c.industry ?? null,
        type: c.type ?? null,
        country: c.country ?? null,
        province: c.province ?? null,
        address: c.address ?? null,
        website: c.website ?? null,
        linkedin: c.linkedin ?? null,
        contactName: c.contactName ?? null,
        contactEmail: c.contactEmail ?? null,
        contactTel: c.contactTel ?? null,
        status: c.status ?? "อยู่ระหว่างพิจารณา",
        mouStatus: c.mouStatus ?? null,
        mouExpiry: toDate(c.mouExpiry),
        openPositions: c.openPositions ?? 0,
        description: c.description ?? null,
        note: c.note ?? null,
        createdAt: toDate(c.createdAt) ?? new Date(),
      },
    });
  }
  console.log(`  ✓ ${DEFAULT_COMPANIES.length} companies`);
}

// ─────────────────────────────────────────────────────────────
// 12. Jobs
// ─────────────────────────────────────────────────────────────
async function seedJobs() {
  console.log("Seeding jobs...");
  for (const j of DEFAULT_JOBS) {
    await prisma.job.upsert({
      where: { id: j.id },
      update: {},
      create: {
        id: j.id,
        title: j.title,
        titleEn: j.titleEn ?? null,
        companyId: j.companyId ?? null,
        companyName: j.companyName ?? null,
        companyLogo: j.companyLogo ?? null,
        type: j.type ?? "ฝึกงาน",
        field: j.field ?? null,
        location: j.location ?? null,
        country: j.country ?? "ไทย",
        salary: j.salary ?? null,
        duration: j.duration ?? null,
        startDate: toDate(j.startDate),
        deadline: toDate(j.deadline),
        slots: j.slots ?? 1,
        applications: j.applications ?? 0,
        status: j.status ?? "เปิดรับ",
        tags: j.tags ?? null,
        description: j.description ?? null,
        requirements: j.requirements ?? null,
        welfare: j.welfare ?? null,
        note: j.note ?? null,
        createdAt: toDate(j.createdAt) ?? new Date(),
      },
    });
  }
  console.log(`  ✓ ${DEFAULT_JOBS.length} jobs`);
}

// ─────────────────────────────────────────────────────────────
// seedMappings
// ─────────────────────────────────────────────────────────────
async function seedMappings() {
  console.log("Seeding mappings...");
  await prisma.jobApplication.deleteMany();
  let count = 0;
  for (const m of DEFAULT_MAPPINGS as any[]) {
    await prisma.jobApplication.create({
      data: {
        id:          m.id,
        studentId:   m.studentId,
        jobId:       m.jobId,
        status:      m.status ?? "สมัครแล้ว",
        appliedDate: m.appliedDate ? new Date(m.appliedDate) : null,
        note:        m.note ?? null,
      },
    });
    count++;
  }
  console.log(`  → ${count} mappings`);
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Starting seed...\n");
  await seedUsers();
  await seedScholarshipTypes();
  await seedStudents();
  await seedNewsCategories();
  await seedNews();
  await seedBanners();
  await seedAlumni();
  await seedSplash();
  await seedContact();
  await seedFaq();
  await seedDocuments();
  await seedCompanies();
  await seedJobs();
  await seedMappings();
  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
