const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const supabase = createClient(process.env.SUPABASE_URL, process.env.API_KEY);

exports.getProduct = async (req, res) => {
  try {
    const data = await prisma.product.findMany();

    if (data === null) {
      return res.status(404).json({ message: "Data produk Kosong" });
    }

    const formattedData = data.map((item) => ({
      ...item,
      urlGambar: `${process.env.STORAGE_URL}${item.gambar}`,
    }));

    res.status(200).json({
      message: "Data produk berhasil diambil",
      data: formattedData,
    });
  } catch (error) {
    console.error("Internal server error, Error: ", error);
    res.status(500).json({ message: "internal server error" });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const data = await prisma.product.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });

    if (data === null) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Data satu produk berhasil diambil",
      data: {
        nama: data.namaProduk,
        harga: data.harga,
        deskripsi: data.deskripsi,
        urlGambar: `${process.env.STORAGE_URL}${data.gambar}`,
        shoppe: data.linkShoppe,
        tokopedia: data.linkTokopedia,
      },
    });
  } catch (error) {
    console.error("Internal server error, Error: ", error);
    res.status(500).json({ message: "internal server error" });
  }
};

exports.postNewProduct = async (req, res) => {
  const { namaProduk, harga, deskripsi, gambar, linkShoppe, linkTokopedia } =
    req.body;
  const file = req.file;

  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized - user ID missing" });
  }

  if (!file) {
    return res.status(400).json({ message: "No image uploaded" }); // Kalau gambar belum ada diupload pas penambahan produk
  }
  try {
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `/produk/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("1mage.storage")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) {
      throw uploadError;
    }

    const imageUrl = `${process.env.STORAGE_URL}/${filePath}`;

    const dataProduct = await prisma.product.create({
      data: {
        namaProduk,
        harga: parseInt(harga),
        deskripsi,
        gambar: filePath,
        linkShoppe,
        linkTokopedia,
        user_id: userId,
        timeAdded: new Date(),
      },
    });

    res.status(201).json({
      message: "Product creation succes",
      data: { ...dataProduct, urlGambar: imageUrl },
    });
  } catch (error) {
    console.error("Internal server error, Error: ", error);
    res.status(500).json({ message: "Failed to add a product", error: error });
  }
};

exports.updateProductData = async (req, res) => {
  const productId = parseInt(req.params.id);
  const { namaProduk, harga, deskripsi, linkShoppe, linkTokopedia, gambar } =
    req.body;
  const file = req.file;

  try {
    const existProduk = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existProduk) {
      return res.status(404).json({ message: "Product not found" });
    }

    let imagePath = existProduk.gambar;

    if (file) {
      const fileName = `${Date.now()}=${file.originalname}`;
      const filePath = `/produk/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("1mage.storage")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) throw uploadError;

      imagePath = filePath;
    }

    // Bypass untuk keperluan testing server-side
    if (!file && gambar) {
      imagePath = `/produk/${gambar}`;
    }

    const updateData = {};

    if (namaProduk !== undefined) updateData.namaProduk = namaProduk;
    if (harga !== undefined) updateData.harga = parseInt(harga);
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
    if (linkShoppe !== undefined) updateData.linkShoppe = linkShoppe;
    if (linkTokopedia !== undefined) updateData.linkTokopedia = linkTokopedia;
    if (file || gambar) updateData.gambar = imagePath;

    const updated = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    const imageUrl = `${process.env.STORAGE_URL}${updated.gambar}`;

    res.status(200).json({
      message: "Update data produk berhasil",
      data: {
        ...updated,
        urlGambar: imageUrl,
      },
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteProductData = async (req, res) => {
  const productId = parseInt(req.params.id);

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    if (product.gambar) {
      const { error: deleteError } = await supabase.storage
        .from("1mage.storage")
        .remove([product.gambar]);

      if (deleteError) {
        console.warn(
          "Gagal menghapus gambar dari storage: ",
          deleteError.message
        );
      }
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    res.status(200).json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
