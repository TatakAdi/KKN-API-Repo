const { PrismaClient } = require("@prisma/client");
const supabase = require("../config/supabaseClient");

const prisma = new PrismaClient();

exports.getTanaman = async (req, res) => {
  try {
    const data = await prisma.tanaman.findMany();

    if (data === null) {
      return res.status(404).json({ message: "Data produk Kosong" });
    }

    const formattedData = data.map((item) => ({
      ...item,
      urlGambar: `${process.env.STORAGE_URL}${item.gambar}`,
    }));

    res.status(200).json({
      message: "Data tanaman berhasil diambil",
      data: formattedData,
    });
  } catch (error) {
    console.error("Internal server error, Error: ", error);
    res.status(500).json({ message: "internal server error" });
  }
};

exports.getTanamanbyId = async (req, res) => {
  try {
    const data = await prisma.tanaman.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });

    if (data === null) {
      return res.status(404).json({ message: "Tanaman not found" });
    }

    res.status(200).json({
      message: "Data satu tanaman berhasil diambil",
      data: {
        nama: data.namaTanaman,
        deskripsi: data.deskripsi,
        urlGambar: `${process.env.STORAGE_URL}${data.gambar}`,
      },
    });
  } catch (error) {
    console.error("Internal server error, Error: ", error);
    res.status(500).json({ message: "internal server error" });
  }
};

exports.createTanaman = async (req, res) => {
  const { namaTanaman, deskripsi } = req.body;
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
    const filePath = `/tanaman/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("1mage.storage")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) {
      throw uploadError;
    }

    const imageUrl = `${process.env.STORAGE_URL}/${filePath}`;

    const dataTanaman = await prisma.tanaman.create({
      data: {
        namaTanaman,
        deskripsi,
        gambar: filePath,
        user_id: userId,
        timeAdded: new Date(),
      },
    });

    res.status(201).json({
      message: "Tanaman creation succes",
      data: { ...dataTanaman, urlGambar: imageUrl },
    });
  } catch (error) {
    console.error("Internal server error, Error: ", error);
    res.status(500).json({ message: "Failed to add a product", error: error });
  }
};

exports.updateTanaman = async (req, res) => {
  const tanamanId = parseInt(req.params.id);
  const { namaTanaman, deskripsi } = req.body;
  const file = req.file;

  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized - user ID missing" });
  }

  try {
    const existTanaman = await prisma.tanaman.findUnique({
      where: { id: tanamanId },
    });

    if (!existTanaman) {
      return res.status(404).json({ message: "Tanaman not found" });
    }

    let imagePath = existTanaman.gambar;

    if (imagePath) {
      let path = imagePath;
      if (path.startsWith("/")) {
        path = path.slice(1);
      }

      const { error: deleteError } = await supabase.storage
        .from("1mage.storage")
        .remove([path]);

      console.log("Gambar barang lama berhasil dihapus");

      if (deleteError) {
        console.error(
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
      const filePath = `/tanaman/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("1mage.storage")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) throw uploadError;

      imagePath = filePath;
    }

    const updateData = {};

    if (namaTanaman !== undefined) updateData.namaTanaman = namaTanaman;
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
    if (file) updateData.gambar = imagePath;

    const updated = await prisma.tanaman.update({
      where: { id: tanamanId },
      data: {
        ...updateData,
        user_id: userId,
      },
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

exports.deleteTanaman = async (req, res) => {
  const tanamanId = parseInt(req.params.id);

  try {
    const tanaman = await prisma.tanaman.findUnique({
      where: { id: tanamanId },
    });

    if (!tanaman) {
      return res.status(404).json({ message: "Tanaman tidak ditemukan" });
    }

    if (tanaman.gambar) {
      let path = tanaman.gambar;
      if (path.startsWith("/")) {
        path = path.slice(1);
      }

      const { error: deleteError } = await supabase.storage
        .from("1mage.storage")
        .remove([path]);

      console.log("Gambar barang berhasil dihapus");

      if (deleteError) {
        console.error(
          "Gagal menghapus gambar dari storage: ",
          deleteError.message
        );
        return res.status(401).json({
          message: "Gagal menghapus Tanaman dari storage",
          error: deleteError,
        });
      }
    }

    await prisma.tanaman.delete({
      where: { id: tanaman },
    });

    res.status(200).json({ message: "Tanaman berhasil dihapus" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
