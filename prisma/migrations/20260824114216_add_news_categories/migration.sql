-- CreateTable
CREATE TABLE "news_categories" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(100) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_categories_name_key" ON "news_categories"("name");
