-- CreateTable
CREATE TABLE "CarouselSlide" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "bgColor" TEXT,
  "imageUrl" TEXT,
  "orden" INTEGER NOT NULL,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CarouselSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfoPanel" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "notaImportante" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InfoPanel_pkey" PRIMARY KEY ("id")
); 