-- ============================================================
--  KOSEN Demo — Database Schema
--  Generated from web app data structure (lib/*.js)
--  Compatible with MySQL 8.0 / MySQL Workbench
-- ============================================================

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE DATABASE IF NOT EXISTS `kosen_demo` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `kosen_demo`;

-- ============================================================
--  users
-- ============================================================
CREATE TABLE `users` (
  `id`                  VARCHAR(20)   NOT NULL,
  `username`            VARCHAR(100)  NOT NULL UNIQUE,
  `password`            VARCHAR(255)  NOT NULL,
  `password_updated_at` DATE          NULL,
  `name`                VARCHAR(100)  NOT NULL,
  `name_en`             VARCHAR(100)  NULL,
  `email`               VARCHAR(150)  NOT NULL UNIQUE,
  `role`                ENUM('superadmin','admin','staff') NOT NULL DEFAULT 'staff',
  `department`          VARCHAR(100)  NULL,
  `university`          VARCHAR(100)  NULL,
  `tel`                 VARCHAR(20)   NULL,
  `last_login`          DATE          NULL,
  `status`              ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `note`                TEXT          NULL,
  `created_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  scholarship_types  (ต้องสร้างก่อน students)
-- ============================================================
CREATE TABLE `scholarship_types` (
  `id`              VARCHAR(20)   NOT NULL,
  `slug`            VARCHAR(50)   NOT NULL UNIQUE,
  `name`            VARCHAR(100)  NOT NULL,
  `icon`            VARCHAR(10)   NULL,
  `coverage`        VARCHAR(200)  NULL,
  `value_per_sem`   VARCHAR(100)  NULL,
  `value_total`     VARCHAR(100)  NULL,
  `count`           INT           NOT NULL DEFAULT 0,
  `featured`        TINYINT(1)    NOT NULL DEFAULT 0,
  `criteria`        JSON          NULL,
  `benefits`        JSON          NULL,
  `note`            TEXT          NULL,
  `status`          ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `order`           INT           NOT NULL DEFAULT 0,
  `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  students
-- ============================================================
CREATE TABLE `students` (
  `id`                    VARCHAR(20)   NOT NULL,

  -- ข้อมูลส่วนตัว
  `prefix`                VARCHAR(20)   NULL,
  `prefix_en`             VARCHAR(20)   NULL,
  `name`                  VARCHAR(100)  NOT NULL,
  `name_en`               VARCHAR(100)  NULL,
  `lastname`              VARCHAR(100)  NOT NULL,
  `lastname_en`           VARCHAR(100)  NULL,
  `nickname`              VARCHAR(50)   NULL,
  `gender`                ENUM('ชาย','หญิง','อื่นๆ') NULL,
  `dob`                   DATE          NULL,
  `national_id`           VARCHAR(20)   NULL UNIQUE,
  `passport`              VARCHAR(20)   NULL,
  `military_status`       VARCHAR(50)   NULL,

  -- ช่องทางติดต่อ
  `tel`                   VARCHAR(20)   NULL,
  `email`                 VARCHAR(150)  NULL,
  `line_id`               VARCHAR(100)  NULL,
  `country`               VARCHAR(50)   NULL DEFAULT 'ไทย',

  -- ที่อยู่ประเทศไทย
  `addr_th_house_no`      VARCHAR(50)   NULL,
  `addr_th_subdistrict`   VARCHAR(100)  NULL,
  `addr_th_district`      VARCHAR(100)  NULL,
  `addr_th_province`      VARCHAR(100)  NULL,
  `addr_th_postal_code`   VARCHAR(10)   NULL,

  -- ที่อยู่ประเทศญี่ปุ่น
  `addr_jp_postal_code`   VARCHAR(10)   NULL,
  `addr_jp_prefecture`    VARCHAR(100)  NULL,
  `addr_jp_city`          VARCHAR(100)  NULL,
  `addr_jp_street_address` VARCHAR(200) NULL,
  `addr_jp_building`      VARCHAR(200)  NULL,

  -- การศึกษาก่อนหน้า
  `prev_school`           VARCHAR(200)  NULL,

  -- ทุนการศึกษา
  `scholarship`           VARCHAR(100)  NULL,
  `scholarship_type_id`   VARCHAR(20)   NULL,

  -- บัญชีธนาคาร (รับทุน)
  `bank_name`             VARCHAR(100)  NULL,
  `bank_branch`           VARCHAR(100)  NULL,
  `bank_account_no`       VARCHAR(30)   NULL,

  -- ข้อมูลการเดินทาง
  `departure_date_th`     DATE          NULL,
  `arrival_date_jp`       DATE          NULL,

  -- สถานะและหมายเหตุ
  `status`                ENUM('กำลังศึกษา','ฝึกงาน','พักการศึกษา','จบการศึกษา','พ้นสภาพ') NOT NULL DEFAULT 'กำลังศึกษา',
  `note`                  TEXT          NULL,
  `avatar`                VARCHAR(500)  NULL,
  `created_by`            VARCHAR(20)   NULL,
  `created_at`            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  CONSTRAINT `fk_student_scholarship` FOREIGN KEY (`scholarship_type_id`) REFERENCES `scholarship_types` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_student_created_by`  FOREIGN KEY (`created_by`)          REFERENCES `users`            (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  student_enrollments  (สถาบันที่นักศึกษาสังกัด 1–3 แห่ง)
--  order = 1 → KOSEN ไทย (สถาบันหลัก)
--  order = 2 → มหาวิทยาลัยญี่ปุ่นแห่งที่ 1
--  order = 3 → มหาวิทยาลัยญี่ปุ่นแห่งที่ 2 (ถ้ามี)
-- ============================================================
CREATE TABLE `student_enrollments` (
  `id`            INT           NOT NULL AUTO_INCREMENT,
  `student_id`    VARCHAR(20)   NOT NULL,
  `order`         TINYINT       NOT NULL DEFAULT 1,
  `university`    VARCHAR(200)  NOT NULL,
  `student_no`    VARCHAR(50)   NULL,
  `univ_email`    VARCHAR(150)  NULL,
  `faculty`       VARCHAR(100)  NULL,
  `department`    VARCHAR(100)  NULL,
  `major`         VARCHAR(100)  NULL,
  `year`          VARCHAR(5)    NULL,
  `advisor`       VARCHAR(100)  NULL,
  `project`       TEXT          NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_student_order` (`student_id`, `order`),
  CONSTRAINT `fk_enrollment_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  alumni
-- ============================================================
CREATE TABLE `alumni` (
  `id`                  VARCHAR(20)   NOT NULL,
  `student_id`          VARCHAR(20)   NULL,
  `prefix`              VARCHAR(20)   NULL,
  `name`                VARCHAR(100)  NOT NULL,
  `lastname`            VARCHAR(100)  NOT NULL,
  `nickname`            VARCHAR(50)   NULL,
  `graduated_year`      INT           NULL,
  `major`               VARCHAR(100)  NULL,
  `university`          VARCHAR(100)  NULL,
  `scholarship_type_id` VARCHAR(20)   NULL,
  `scholarship_years`   INT           NULL,
  `scholarship_status`  VARCHAR(50)   NULL,
  `contact`             VARCHAR(150)  NULL,
  `phone`               VARCHAR(20)   NULL,
  `remark`              TEXT          NULL,
  `created_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_alumni_student`      FOREIGN KEY (`student_id`)          REFERENCES `students`         (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_alumni_scholarship`  FOREIGN KEY (`scholarship_type_id`) REFERENCES `scholarship_types`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  alumni_employment_history
-- ============================================================
CREATE TABLE `alumni_employment_history` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `alumni_id`   VARCHAR(20)   NOT NULL,
  `company`     VARCHAR(200)  NOT NULL,
  `position`    VARCHAR(100)  NOT NULL,
  `start_date`  VARCHAR(10)   NULL,
  `end_date`    VARCHAR(10)   NULL,
  `location`    VARCHAR(100)  NULL,
  `type`        VARCHAR(50)   NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_emp_history_alumni` FOREIGN KEY (`alumni_id`) REFERENCES `alumni` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  companies
-- ============================================================
CREATE TABLE `companies` (
  `id`              VARCHAR(20)   NOT NULL,
  `name`            VARCHAR(200)  NOT NULL,
  `name_en`         VARCHAR(200)  NULL,
  `industry`        VARCHAR(100)  NULL,
  `type`            VARCHAR(100)  NULL,
  `country`         VARCHAR(50)   NULL,
  `province`        VARCHAR(100)  NULL,
  `address`         TEXT          NULL,
  `website`         VARCHAR(300)  NULL,
  `linkedin`        VARCHAR(300)  NULL,
  `contact_name`    VARCHAR(100)  NULL,
  `contact_email`   VARCHAR(150)  NULL,
  `contact_tel`     VARCHAR(20)   NULL,
  `status`          ENUM('ร่วมมือ','เคยร่วมมือ','อยู่ระหว่างพิจารณา') NOT NULL DEFAULT 'อยู่ระหว่างพิจารณา',
  `mou_status`      VARCHAR(50)   NULL,
  `mou_expiry`      DATE          NULL,
  `open_positions`  INT           NOT NULL DEFAULT 0,
  `description`     TEXT          NULL,
  `note`            TEXT          NULL,
  `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  jobs
-- ============================================================
CREATE TABLE `jobs` (
  `id`            VARCHAR(20)   NOT NULL,
  `title`         VARCHAR(200)  NOT NULL,
  `title_en`      VARCHAR(200)  NULL,
  `company_id`    VARCHAR(20)   NULL,
  `company_name`  VARCHAR(200)  NULL,
  `company_logo`  VARCHAR(500)  NULL,
  `type`          ENUM('ฝึกงาน','งานประจำ','สหกิจศึกษา') NOT NULL DEFAULT 'ฝึกงาน',
  `field`         VARCHAR(100)  NULL,
  `location`      VARCHAR(100)  NULL,
  `country`       VARCHAR(50)   NULL DEFAULT 'ไทย',
  `salary`        VARCHAR(100)  NULL,
  `duration`      VARCHAR(100)  NULL,
  `start_date`    DATE          NULL,
  `deadline`      DATE          NULL,
  `slots`         INT           NOT NULL DEFAULT 1,
  `applications`  INT           NOT NULL DEFAULT 0,
  `status`        ENUM('เปิดรับ','ปิดรับ','เต็มแล้ว') NOT NULL DEFAULT 'เปิดรับ',
  `tags`          JSON          NULL,
  `description`   TEXT          NULL,
  `requirements`  TEXT          NULL,
  `welfare`       TEXT          NULL,
  `note`          TEXT          NULL,
  `created_by`    VARCHAR(20)   NULL,
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_jobs_company`     FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_jobs_created_by`  FOREIGN KEY (`created_by`) REFERENCES `users`     (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  job_applications  (mapping นักศึกษา <-> ตำแหน่ง)
-- ============================================================
CREATE TABLE `job_applications` (
  `id`            VARCHAR(20)   NOT NULL,
  `student_id`    VARCHAR(20)   NOT NULL,
  `job_id`        VARCHAR(20)   NOT NULL,
  `status`        ENUM('สมัครแล้ว','ผ่านการคัดเลือก','ไม่ผ่านการคัดเลือก','ถอนการสมัคร') NOT NULL DEFAULT 'สมัครแล้ว',
  `applied_date`  DATE          NULL,
  `reviewed_by`   VARCHAR(20)   NULL,
  `note`          TEXT          NULL,
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_application_student`     FOREIGN KEY (`student_id`)  REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_application_job`         FOREIGN KEY (`job_id`)      REFERENCES `jobs`     (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_application_reviewed_by` FOREIGN KEY (`reviewed_by`) REFERENCES `users`    (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  internships
-- ============================================================
CREATE TABLE `internships` (
  `id`              VARCHAR(20)   NOT NULL,
  `application_id`  VARCHAR(20)   NULL,
  `student_id`      VARCHAR(20)   NOT NULL,
  `job_id`          VARCHAR(20)   NULL,
  `company_id`      VARCHAR(20)   NULL,
  `start_date`      DATE          NULL,
  `end_date`        DATE          NULL,
  `hours_completed` INT           NOT NULL DEFAULT 0,
  `hours_required`  INT           NOT NULL DEFAULT 0,
  `supervisor_name` VARCHAR(100)  NULL,
  `advisor_name`    VARCHAR(100)  NULL,
  `status`          ENUM('กำลังฝึกงาน','เสร็จสิ้น','ยกเลิก') NOT NULL DEFAULT 'กำลังฝึกงาน',
  `grade`           VARCHAR(5)    NULL,
  `note`            TEXT          NULL,
  `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_internship_student`     FOREIGN KEY (`student_id`)     REFERENCES `students`         (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_internship_job`         FOREIGN KEY (`job_id`)         REFERENCES `jobs`             (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_internship_company`     FOREIGN KEY (`company_id`)     REFERENCES `companies`        (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_internship_application` FOREIGN KEY (`application_id`) REFERENCES `job_applications` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  news
-- ============================================================
CREATE TABLE `news` (
  `id`              VARCHAR(20)   NOT NULL,
  `title`           TEXT          NOT NULL,
  `slug`            VARCHAR(300)  NULL,
  `category`        VARCHAR(100)  NULL,
  `cat_color`       VARCHAR(100)  NULL,
  `excerpt`         TEXT          NULL,
  `image`           VARCHAR(500)  NULL,
  `author_id`       VARCHAR(20)   NULL,
  `author_name`     VARCHAR(100)  NULL,
  `tags`            JSON          NULL,
  `status`          ENUM('published','draft') NOT NULL DEFAULT 'draft',
  `featured`        TINYINT(1)    NOT NULL DEFAULT 0,
  `published_at`    DATE          NULL,
  `hero_aspect`     VARCHAR(10)   NULL DEFAULT '21/9',
  `image_position`  VARCHAR(50)   NULL DEFAULT 'center',
  `views`           INT           NOT NULL DEFAULT 0,
  `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_news_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  news_blocks
-- ============================================================
CREATE TABLE `news_blocks` (
  `id`              VARCHAR(20)   NOT NULL,
  `news_id`         VARCHAR(20)   NOT NULL,
  `order`           INT           NOT NULL DEFAULT 0,
  `type`            ENUM('paragraph','heading1','heading2','heading3','heading4','image','spacer') NOT NULL,
  `content`         TEXT          NULL,
  `src`             VARCHAR(500)  NULL,
  `alt`             VARCHAR(300)  NULL,
  `caption`         VARCHAR(300)  NULL,
  `font_size`       ENUM('sm','base','lg','xl') NULL DEFAULT 'base',
  `image_size`      VARCHAR(10)   NULL DEFAULT '16/9',
  `object_position` VARCHAR(50)   NULL DEFAULT 'center',
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_block_news` FOREIGN KEY (`news_id`) REFERENCES `news` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  activities
-- ============================================================
CREATE TABLE `activities` (
  `id`          VARCHAR(20)   NOT NULL,
  `title`       TEXT          NOT NULL,
  `slug`        VARCHAR(300)  NULL,
  `type`        VARCHAR(50)   NULL,
  `type_color`  VARCHAR(100)  NULL,
  `date`        DATE          NULL,
  `location`    VARCHAR(200)  NULL,
  `image`       VARCHAR(500)  NULL,
  `excerpt`     TEXT          NULL,
  `organizer`   VARCHAR(200)  NULL,
  `tags`        JSON          NULL,
  `status`      ENUM('published','draft') NOT NULL DEFAULT 'draft',
  `featured`    TINYINT(1)    NOT NULL DEFAULT 0,
  `views`       INT           NOT NULL DEFAULT 0,
  `created_by`  VARCHAR(20)   NULL,
  `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_activity_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  activity_blocks
-- ============================================================
CREATE TABLE `activity_blocks` (
  `id`              VARCHAR(20)   NOT NULL,
  `activity_id`     VARCHAR(20)   NOT NULL,
  `order`           INT           NOT NULL DEFAULT 0,
  `type`            ENUM('paragraph','heading1','heading2','heading3','heading4','image','spacer') NOT NULL,
  `content`         TEXT          NULL,
  `src`             VARCHAR(500)  NULL,
  `alt`             VARCHAR(300)  NULL,
  `caption`         VARCHAR(300)  NULL,
  `font_size`       ENUM('sm','base','lg','xl') NULL DEFAULT 'base',
  `image_size`      VARCHAR(10)   NULL DEFAULT '16/9',
  `object_position` VARCHAR(50)   NULL DEFAULT 'center',
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_block_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  student_activities  (นักศึกษา <-> กิจกรรม)
-- ============================================================
CREATE TABLE `student_activities` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `student_id`   VARCHAR(20)  NOT NULL,
  `activity_id`  VARCHAR(20)  NOT NULL,
  `joined_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_student_activity` (`student_id`, `activity_id`),
  CONSTRAINT `fk_sa_student`  FOREIGN KEY (`student_id`)  REFERENCES `students`   (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sa_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  documents
-- ============================================================
CREATE TABLE `documents` (
  `id`              VARCHAR(20)   NOT NULL,
  `category`        VARCHAR(50)   NULL,
  `title`           VARCHAR(300)  NOT NULL,
  `description`     TEXT          NULL,
  `raw_date`        DATE          NULL,
  `file_type`       VARCHAR(10)   NULL,
  `file_size`       VARCHAR(20)   NULL,
  `file_url`        VARCHAR(500)  NULL,
  `is_new`          TINYINT(1)    NOT NULL DEFAULT 0,
  `status`          ENUM('published','draft') NOT NULL DEFAULT 'draft',
  `uploaded_by`     VARCHAR(20)   NULL,
  `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_document_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  faq
-- ============================================================
CREATE TABLE `faq` (
  `id`          VARCHAR(20)   NOT NULL,
  `question`    TEXT          NOT NULL,
  `answer`      TEXT          NOT NULL,
  `category`    VARCHAR(50)   NULL,
  `order`       INT           NOT NULL DEFAULT 0,
  `status`      ENUM('published','draft') NOT NULL DEFAULT 'published',
  `created_by`  VARCHAR(20)   NULL,
  `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_faq_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  banners
-- ============================================================
CREATE TABLE `banners` (
  `id`               VARCHAR(20)   NOT NULL,
  `layout`           ENUM('hero','news-single','activity-single','news','activity') NOT NULL DEFAULT 'hero',
  `eyebrow`          VARCHAR(200)  NULL,
  `headline`         VARCHAR(300)  NULL,
  `body`             TEXT          NULL,
  `badge`            VARCHAR(100)  NULL,
  `news_id`          VARCHAR(20)   NULL,
  `activity_id`      VARCHAR(20)   NULL,
  `cta_label`        VARCHAR(100)  NULL,
  `cta_href`         VARCHAR(500)  NULL,
  `secondary_label`  VARCHAR(100)  NULL,
  `secondary_href`   VARCHAR(500)  NULL,
  `image`            VARCHAR(500)  NULL,
  `image_position`   VARCHAR(50)   NULL DEFAULT 'center',
  `status`           ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `order`            INT           NOT NULL DEFAULT 0,
  `created_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_banner_news`     FOREIGN KEY (`news_id`)     REFERENCES `news`       (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_banner_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  splash_config
-- ============================================================
CREATE TABLE `splash_config` (
  `id`              INT           NOT NULL AUTO_INCREMENT,
  `enabled`         TINYINT(1)    NOT NULL DEFAULT 0,
  `image`           VARCHAR(500)  NULL,
  `title`           VARCHAR(300)  NULL,
  `body`            TEXT          NULL,
  `cta_label`       VARCHAR(100)  NULL,
  `cta_href`        VARCHAR(500)  NULL,
  `show_frequency`  ENUM('always','once_per_session','once_per_day') NOT NULL DEFAULT 'once_per_session',
  `delay_ms`        INT           NOT NULL DEFAULT 500,
  `width`           ENUM('sm','md','lg') NOT NULL DEFAULT 'md',
  `border`          TINYINT(1)    NOT NULL DEFAULT 1,
  `radius`          ENUM('none','lg','2xl','3xl') NOT NULL DEFAULT '2xl',
  `updated_by`      VARCHAR(20)   NULL,
  `updated_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_splash_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  contact_info
-- ============================================================
CREATE TABLE `contact_info` (
  `id`      VARCHAR(10)   NOT NULL,
  `icon`    VARCHAR(10)   NULL,
  `label`   VARCHAR(100)  NOT NULL,
  `lines`   JSON          NOT NULL,
  `href`    VARCHAR(300)  NULL,
  `order`   INT           NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  contact_universities
-- ============================================================
CREATE TABLE `contact_universities` (
  `id`        VARCHAR(10)   NOT NULL,
  `name`      VARCHAR(50)   NOT NULL,
  `full_name` VARCHAR(200)  NOT NULL,
  `location`  VARCHAR(100)  NULL,
  `phone`     VARCHAR(30)   NULL,
  `email`     VARCHAR(150)  NULL,
  `map_url`   VARCHAR(500)  NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  student_history  (audit log)
-- ============================================================
CREATE TABLE `student_history` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `student_id`  VARCHAR(20)   NOT NULL,
  `old_data`    JSON          NULL,
  `new_data`    JSON          NULL,
  `action_type` ENUM('create','update','delete') NOT NULL,
  `changed_by`  VARCHAR(20)   NULL,
  `changed_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_history_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_history_user`    FOREIGN KEY (`changed_by`) REFERENCES `users`    (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
