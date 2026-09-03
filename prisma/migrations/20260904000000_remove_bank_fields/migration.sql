-- Remove bank account fields from students table
ALTER TABLE "students" DROP COLUMN IF EXISTS "bank_name";
ALTER TABLE "students" DROP COLUMN IF EXISTS "bank_branch";
ALTER TABLE "students" DROP COLUMN IF EXISTS "bank_account_no";
