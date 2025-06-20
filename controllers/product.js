const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");

const prisma = new PrismaClient();

exports.getProduct = async (req, res) => {
  try {
    const data = await prisma.product.findMany();

    if (data === null) {
      return res.status(404).json({ message: "Data produk Kosong" });
    }

    const formattedData = data.map((item) => ({
      id: item.id,
      namaProduk: item.namaProduk,
      harga: item.harga,
      deskripsi: item.deskripsi,
      linkShoppe: item.linkShoppe,
      linkTokopedia: item.linkTokopedia,
      timeAdded: item.timeAdded,
      urlGambar: `${process.env.STORAGE_URL}${item.gambar}`,
    }));

    res.status(200).json({
      message: "Data produk berhasil diambil",
      data: formattedData,
    });
  } catch (error) {
    console.error("Internal server error, Error: ", error);
    res.status(500).json({ message: "Internal server error" });
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
      return res.status(404).json({ message: "Produk tidak ditemukan" });
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
  const { namaProduk, harga, deskripsi, linkShoppe, linkTokopedia } = req.body;
  const file = req.file;
  const token = req.headers.authorization?.split(" ")[1];
  const userId = req.userId;
  const supabaseUser = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized - user ID missing" });
  }

  if (!file) {
    return res.status(400).json({ message: "Tidak ada gambar yang diupload" }); // Kalau gambar belum ada diupload pas penambahan produk
  }
  try {
    // Yang ini ternyata yang bermasalah wak
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `/produk/${fileName}`;

    const { error: uploadError } = await supabaseUser.storage
      .from("1mage.storage")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const imageUrl = `${process.env.STORAGE_URL}${filePath}`;

    const dataInput = {
      namaProduk,
      harga: parseInt(harga),
      deskripsi,
      gambar: filePath,
      linkShoppe,
      linkTokopedia,
    };

    await prisma.product.create({
      data: {
        ...dataInput,
        user_id: userId,
        timeAdded: new Date(),
      },
    });

    // if (error) throw error;

    res.status(201).json({
      message: "Penambahan produk sukses",
      data: { ...dataInput, imageUrl },
    });
  } catch (error) {
    console.error("Internal server error, Error: ", error);
    res
      .status(500)
      .json({ message: "Gagal menambahkan product", error: error });
  }
};

exports.updateProductData = async (req, res) => {
  const productId = parseInt(req.params.id);
  const { namaProduk, harga, deskripsi, linkShoppe, linkTokopedia } = req.body;
  const token = req.headers.authorization?.split(" ")[1];
  const file = req.file;
  const userId = req.userId;

  const hargaInt = parseInt(harga);

  if (!token) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }
  const supabaseUser = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized - user ID missing" });
  }

  try {
    const existProduk = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existProduk) {
      return res.status(404).json({ message: "Product not found" });
    }

    let imagePath = existProduk.gambar;

    if (imagePath) {
      let path = imagePath;
      if (path.startsWith("/")) {
        path = path.slice(1);
      }

      const { error: deleteError } = await supabaseUser.storage
        .from("1mage.storage")
        .remove([path]);

      console.log("Gambar barang lama berhasil dihapus");

      if (deleteError) {
        console.log(
          "Gagal menghapus gambar lama dari storage: ",
          deleteError.message
        );
        return res.status(401).json({
          message: "Gagal menghapus gambar barang lama dari storage",
          error: deleteError,
        });
      }
    }

    if (file) {
      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = `/produk/${fileName}`;

      const { error: uploadError } = await supabaseUser.storage
        .from("1mage.storage")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) throw uploadError;

      imagePath = filePath;
    }

    const updateData = {};

    if (namaProduk !== undefined && namaProduk !== "")
      updateData.namaProduk = namaProduk;
    if (harga !== undefined && !isNaN(hargaInt) && harga !== "")
      updateData.harga = hargaInt;
    if (deskripsi !== undefined && deskripsi !== "")
      updateData.deskripsi = deskripsi;
    if (linkShoppe !== undefined && linkShoppe !== "")
      updateData.linkShoppe = linkShoppe;
    if (linkTokopedia !== undefined && linkTokopedia !== "")
      updateData.linkTokopedia = linkTokopedia;
    if (file) updateData.gambar = imagePath;

    await prisma.product.update({
      where: { id: productId },
      data: {
        ...updateData,
        user_id: userId,
      },
    });

    let imageUrl;
    if (file) {
      imageUrl = `${process.env.STORAGE_URL}${updateData.gambar}`;
    } else {
      imageUrl = `${process.env.STORAGE_URL}${existProduk.gambar}`;
    }

    res.status(200).json({
      message: "Update data produk berhasil",
      data: {
        ...updateData,
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
  const token = req.headers.authorization?.split(" ")[1];
  const supabaseUser = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    // Problem nya disini wak
    if (product.gambar) {
      let path = product.gambar;
      if (path.startsWith("/")) {
        path = path.slice(1);
      }

      const { error: deleteError } = await supabaseUser.storage
        .from("1mage.storage")
        .remove([path]);

      console.log("Gambar barang berhasil dihapus");

      if (deleteError) {
        console.log(
          "Gagal menghapus gambar dari storage: ",
          deleteError.message
        );
        return res.status(401).json({
          message: "Gagal menghapus barang dari storage",
          error: deleteError,
        });
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
