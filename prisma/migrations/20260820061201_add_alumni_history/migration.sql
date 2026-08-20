-- CreateTable
CREATE TABLE "alumni_history" (
    "id" SERIAL NOT NULL,
    "alumni_id" VARCHAR(20) NOT NULL,
    "old_data" JSONB,
    "new_data" JSONB,
    "action_type" "HistoryAction" NOT NULL,
    "changed_by" VARCHAR(20),
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alumni_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "alumni_history" ADD CONSTRAINT "alumni_history_alumni_id_fkey" FOREIGN KEY ("alumni_id") REFERENCES "alumni"("id") ON DELETE CASCADE ON UPDATE CASCADE;
