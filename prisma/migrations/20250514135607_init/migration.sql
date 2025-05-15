-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" SERIAL NOT NULL,
    "namaProduk" TEXT NOT NULL,
    "harga" INTEGER NOT NULL,
    "deskripsi" TEXT,
    "gambar" TEXT,
    "linkShoppe" TEXT,
    "linkTokopedia" TEXT,
    "timeAdded" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tanaman" (
    "id" SERIAL NOT NULL,
    "namaTanaman" TEXT NOT NULL,
    "deskripsi" TEXT,
    "gambar" TEXT,
    "timeAdded" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tanaman_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_fullName_key" ON "users"("fullName");
