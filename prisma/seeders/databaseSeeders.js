require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Mulai enkripsi");

    console.log("Menambahkan Admin");
    const adminTest = await prisma.users.create({
      data: {
        fullName: "KampungToga",
        email: "kampungpanganberseri49@gmail.com",
        password: await bcrypt.hash("K4mpungT0g@Pang4nBerseri", 10),
      },
    });

    console.log("Menambahkan productTest");
    const productTest = await prisma.product.create({
      data: {
        namaProduk: "Keripik Bayam",
        harga: 10000,
        deskripsi: "",
        gambar: "",
        linkShoppe: "",
        linkTokopedia: "",
        timeAdded: new Date(),
      },
    });

    console.log("Menambahkan tanamanTest");
    const tanamanTest = await prisma.budidaya.create({
      data: {
        namaSpesies: "Bayam Brazil",
        deskripsi: "",
        gambar: "",
        timeAdded: new Date(),
      },
    });

    console.log({ adminTest, productTest, tanamanTest });
  } catch (e) {
    console.error("Error saat seeding:", e);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    await prisma.$disconnect();
    process.exit(1);
  });
