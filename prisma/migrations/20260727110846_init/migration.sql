-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('superadmin', 'admin', 'staff');

-- CreateEnum
CREATE TYPE "ActiveStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('published', 'draft');

-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('paragraph', 'heading1', 'heading2', 'heading3', 'heading4', 'image', 'spacer');

-- CreateEnum
CREATE TYPE "FontSize" AS ENUM ('sm', 'base', 'lg', 'xl');

-- CreateEnum
CREATE TYPE "BannerLayout" AS ENUM ('hero', 'news-single', 'activity-single', 'news', 'activity');

-- CreateEnum
CREATE TYPE "ShowFrequency" AS ENUM ('always', 'once_per_session', 'once_per_day');

-- CreateEnum
CREATE TYPE "SplashWidth" AS ENUM ('sm', 'md', 'lg');

-- CreateEnum
CREATE TYPE "SplashRadius" AS ENUM ('none', 'lg', '2xl', '3xl');

-- CreateEnum
CREATE TYPE "HistoryAction" AS ENUM ('create', 'update', 'delete');

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(20) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "password_updated_at" DATE,
    "name" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "email" VARCHAR(150) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'staff',
    "department" VARCHAR(100),
    "university" VARCHAR(100),
    "tel" VARCHAR(20),
    "last_login" DATE,
    "status" "ActiveStatus" NOT NULL DEFAULT 'active',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarship_types" (
    "id" VARCHAR(20) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(10),
    "coverage" VARCHAR(200),
    "value_per_sem" VARCHAR(100),
    "value_total" VARCHAR(100),
    "count" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "criteria" JSONB,
    "benefits" JSONB,
    "note" TEXT,
    "status" "ActiveStatus" NOT NULL DEFAULT 'active',
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scholarship_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" VARCHAR(20) NOT NULL,
    "prefix" VARCHAR(20),
    "prefix_en" VARCHAR(20),
    "name" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "lastname" VARCHAR(100) NOT NULL,
    "lastname_en" VARCHAR(100),
    "nickname" VARCHAR(50),
    "gender" VARCHAR(20),
    "dob" DATE,
    "national_id" VARCHAR(20),
    "passport" VARCHAR(20),
    "military_status" VARCHAR(50),
    "tel" VARCHAR(20),
    "email" VARCHAR(150),
    "line_id" VARCHAR(100),
    "country" VARCHAR(50) DEFAULT 'ไทย',
    "addr_th_house_no" VARCHAR(50),
    "addr_th_subdistrict" VARCHAR(100),
    "addr_th_district" VARCHAR(100),
    "addr_th_province" VARCHAR(100),
    "addr_th_postal_code" VARCHAR(10),
    "addr_jp_postal_code" VARCHAR(10),
    "addr_jp_prefecture" VARCHAR(100),
    "addr_jp_city" VARCHAR(100),
    "addr_jp_street_address" VARCHAR(200),
    "addr_jp_building" VARCHAR(200),
    "prev_school" VARCHAR(200),
    "scholarship" VARCHAR(100),
    "scholarship_type_id" VARCHAR(20),
    "bank_name" VARCHAR(100),
    "bank_branch" VARCHAR(100),
    "bank_account_no" VARCHAR(30),
    "departure_date_th" DATE,
    "arrival_date_jp" DATE,
    "status" VARCHAR(30) NOT NULL DEFAULT 'กำลังศึกษา',
    "note" TEXT,
    "avatar" VARCHAR(500),
    "created_by" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_enrollments" (
    "id" SERIAL NOT NULL,
    "student_id" VARCHAR(20) NOT NULL,
    "order" SMALLINT NOT NULL DEFAULT 1,
    "university" VARCHAR(200) NOT NULL,
    "student_no" VARCHAR(50),
    "univ_email" VARCHAR(150),
    "faculty" VARCHAR(100),
    "department" VARCHAR(100),
    "major" VARCHAR(100),
    "year" VARCHAR(5),
    "advisor" VARCHAR(100),
    "project" TEXT,

    CONSTRAINT "student_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumni" (
    "id" VARCHAR(20) NOT NULL,
    "student_id" VARCHAR(20),
    "prefix" VARCHAR(20),
    "name" VARCHAR(100) NOT NULL,
    "lastname" VARCHAR(100) NOT NULL,
    "nickname" VARCHAR(50),
    "graduated_year" INTEGER,
    "major" VARCHAR(100),
    "university" VARCHAR(100),
    "scholarship_type_id" VARCHAR(20),
    "scholarship_years" INTEGER,
    "scholarship_status" VARCHAR(50),
    "contact" VARCHAR(150),
    "phone" VARCHAR(20),
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alumni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumni_employment_history" (
    "id" SERIAL NOT NULL,
    "alumni_id" VARCHAR(20) NOT NULL,
    "company" VARCHAR(200) NOT NULL,
    "position" VARCHAR(100) NOT NULL,
    "start_date" VARCHAR(10),
    "end_date" VARCHAR(10),
    "location" VARCHAR(100),
    "type" VARCHAR(50),

    CONSTRAINT "alumni_employment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "name_en" VARCHAR(200),
    "industry" VARCHAR(100),
    "type" VARCHAR(100),
    "country" VARCHAR(50),
    "province" VARCHAR(100),
    "address" TEXT,
    "website" VARCHAR(300),
    "linkedin" VARCHAR(300),
    "contact_name" VARCHAR(100),
    "contact_email" VARCHAR(150),
    "contact_tel" VARCHAR(20),
    "status" VARCHAR(50) NOT NULL DEFAULT 'อยู่ระหว่างพิจารณา',
    "mou_status" VARCHAR(50),
    "mou_expiry" DATE,
    "open_positions" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" VARCHAR(20) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "title_en" VARCHAR(200),
    "company_id" VARCHAR(20),
    "company_name" VARCHAR(200),
    "company_logo" VARCHAR(500),
    "type" VARCHAR(20) NOT NULL DEFAULT 'ฝึกงาน',
    "field" VARCHAR(100),
    "location" VARCHAR(100),
    "country" VARCHAR(50) DEFAULT 'ไทย',
    "salary" VARCHAR(100),
    "duration" VARCHAR(100),
    "start_date" DATE,
    "deadline" DATE,
    "slots" INTEGER NOT NULL DEFAULT 1,
    "applications" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'เปิดรับ',
    "tags" JSONB,
    "description" TEXT,
    "requirements" TEXT,
    "welfare" TEXT,
    "note" TEXT,
    "created_by" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" VARCHAR(20) NOT NULL,
    "student_id" VARCHAR(20) NOT NULL,
    "job_id" VARCHAR(20) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'สมัครแล้ว',
    "applied_date" DATE,
    "reviewed_by" VARCHAR(20),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internships" (
    "id" VARCHAR(20) NOT NULL,
    "application_id" VARCHAR(20),
    "student_id" VARCHAR(20) NOT NULL,
    "job_id" VARCHAR(20),
    "company_id" VARCHAR(20),
    "start_date" DATE,
    "end_date" DATE,
    "hours_completed" INTEGER NOT NULL DEFAULT 0,
    "hours_required" INTEGER NOT NULL DEFAULT 0,
    "supervisor_name" VARCHAR(100),
    "advisor_name" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'กำลังฝึกงาน',
    "grade" VARCHAR(5),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" VARCHAR(20) NOT NULL,
    "title" TEXT NOT NULL,
    "slug" VARCHAR(300),
    "category" VARCHAR(100),
    "cat_color" VARCHAR(100),
    "excerpt" TEXT,
    "image" VARCHAR(500),
    "author_id" VARCHAR(20),
    "author_name" VARCHAR(100),
    "tags" JSONB,
    "status" "PublishStatus" NOT NULL DEFAULT 'draft',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published_at" DATE,
    "hero_aspect" VARCHAR(10) DEFAULT '21/9',
    "image_position" VARCHAR(50) DEFAULT 'center',
    "views" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_blocks" (
    "id" VARCHAR(20) NOT NULL,
    "news_id" VARCHAR(20) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "type" "BlockType" NOT NULL,
    "content" TEXT,
    "src" VARCHAR(500),
    "alt" VARCHAR(300),
    "caption" VARCHAR(300),
    "font_size" "FontSize" DEFAULT 'base',
    "image_size" VARCHAR(10) DEFAULT '16/9',
    "object_position" VARCHAR(50) DEFAULT 'center',

    CONSTRAINT "news_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" VARCHAR(20) NOT NULL,
    "title" TEXT NOT NULL,
    "slug" VARCHAR(300),
    "type" VARCHAR(50),
    "type_color" VARCHAR(100),
    "date" DATE,
    "location" VARCHAR(200),
    "image" VARCHAR(500),
    "excerpt" TEXT,
    "organizer" VARCHAR(200),
    "tags" JSONB,
    "status" "PublishStatus" NOT NULL DEFAULT 'draft',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "created_by" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_blocks" (
    "id" VARCHAR(20) NOT NULL,
    "activity_id" VARCHAR(20) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "type" "BlockType" NOT NULL,
    "content" TEXT,
    "src" VARCHAR(500),
    "alt" VARCHAR(300),
    "caption" VARCHAR(300),
    "font_size" "FontSize" DEFAULT 'base',
    "image_size" VARCHAR(10) DEFAULT '16/9',
    "object_position" VARCHAR(50) DEFAULT 'center',

    CONSTRAINT "activity_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_activities" (
    "id" SERIAL NOT NULL,
    "student_id" VARCHAR(20) NOT NULL,
    "activity_id" VARCHAR(20) NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" VARCHAR(20) NOT NULL,
    "category" VARCHAR(50),
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "raw_date" DATE,
    "file_type" VARCHAR(10),
    "file_size" VARCHAR(20),
    "file_url" VARCHAR(500),
    "is_new" BOOLEAN NOT NULL DEFAULT false,
    "status" "PublishStatus" NOT NULL DEFAULT 'draft',
    "uploaded_by" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq" (
    "id" VARCHAR(20) NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" VARCHAR(50),
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "PublishStatus" NOT NULL DEFAULT 'published',
    "created_by" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" VARCHAR(20) NOT NULL,
    "layout" "BannerLayout" NOT NULL DEFAULT 'hero',
    "eyebrow" VARCHAR(200),
    "headline" VARCHAR(300),
    "body" TEXT,
    "badge" VARCHAR(100),
    "news_id" VARCHAR(20),
    "activity_id" VARCHAR(20),
    "cta_label" VARCHAR(100),
    "cta_href" VARCHAR(500),
    "secondary_label" VARCHAR(100),
    "secondary_href" VARCHAR(500),
    "image" VARCHAR(500),
    "image_position" VARCHAR(50) DEFAULT 'center',
    "text_size" VARCHAR(10),
    "text_align" VARCHAR(20),
    "status" "ActiveStatus" NOT NULL DEFAULT 'active',
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "splash_config" (
    "id" SERIAL NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "image" VARCHAR(500),
    "title" VARCHAR(300),
    "body" TEXT,
    "cta_label" VARCHAR(100),
    "cta_href" VARCHAR(500),
    "show_frequency" "ShowFrequency" NOT NULL DEFAULT 'once_per_session',
    "delay_ms" INTEGER NOT NULL DEFAULT 500,
    "width" "SplashWidth" NOT NULL DEFAULT 'md',
    "border" BOOLEAN NOT NULL DEFAULT true,
    "radius" "SplashRadius" NOT NULL DEFAULT '2xl',
    "updated_by" VARCHAR(20),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "splash_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_info" (
    "id" VARCHAR(10) NOT NULL,
    "icon" VARCHAR(10),
    "label" VARCHAR(100) NOT NULL,
    "lines" JSONB NOT NULL,
    "href" VARCHAR(300),
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "contact_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_universities" (
    "id" VARCHAR(10) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "full_name" VARCHAR(200) NOT NULL,
    "location" VARCHAR(100),
    "phone" VARCHAR(30),
    "email" VARCHAR(150),
    "map_url" VARCHAR(500),

    CONSTRAINT "contact_universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_history" (
    "id" SERIAL NOT NULL,
    "student_id" VARCHAR(20) NOT NULL,
    "old_data" JSONB,
    "new_data" JSONB,
    "action_type" "HistoryAction" NOT NULL,
    "changed_by" VARCHAR(20),
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "scholarship_types_slug_key" ON "scholarship_types"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "students_national_id_key" ON "students"("national_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_enrollments_student_id_order_key" ON "student_enrollments"("student_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "student_activities_student_id_activity_id_key" ON "student_activities"("student_id", "activity_id");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_scholarship_type_id_fkey" FOREIGN KEY ("scholarship_type_id") REFERENCES "scholarship_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni" ADD CONSTRAINT "alumni_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni" ADD CONSTRAINT "alumni_scholarship_type_id_fkey" FOREIGN KEY ("scholarship_type_id") REFERENCES "scholarship_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni_employment_history" ADD CONSTRAINT "alumni_employment_history_alumni_id_fkey" FOREIGN KEY ("alumni_id") REFERENCES "alumni"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internships" ADD CONSTRAINT "internships_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internships" ADD CONSTRAINT "internships_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internships" ADD CONSTRAINT "internships_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internships" ADD CONSTRAINT "internships_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_blocks" ADD CONSTRAINT "news_blocks_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_blocks" ADD CONSTRAINT "activity_blocks_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_activities" ADD CONSTRAINT "student_activities_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_activities" ADD CONSTRAINT "student_activities_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq" ADD CONSTRAINT "faq_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "splash_config" ADD CONSTRAINT "splash_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_history" ADD CONSTRAINT "student_history_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_history" ADD CONSTRAINT "student_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
