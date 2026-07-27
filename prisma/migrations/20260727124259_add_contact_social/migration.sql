-- CreateTable
CREATE TABLE "contact_social" (
    "id" VARCHAR(10) NOT NULL,
    "icon" VARCHAR(10),
    "label" VARCHAR(100) NOT NULL,
    "handle" VARCHAR(100),
    "href" VARCHAR(500),
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "contact_social_pkey" PRIMARY KEY ("id")
);
