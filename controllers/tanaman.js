const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");
const supabase = require("../config/supabaseClient");

const prisma = new PrismaClient();

exports.getSpesies = async (req, res) => {
  try {
    const data = await prisma.budidaya.findMany();

    if (data === null) {
      return res.status(404).json({ message: "Data spesies Kosong" });
    }

    const formattedData = data.map((item) => ({
      id: item.id,
      namaSpesies: item.namaSpesies,
      deskripsi: item.deskripsi,
      timeAdded: item.timeAdded,
      urlGambar: `${process.env.STORAGE_URL}${item.gambar}`,
    }));

    res.status(200).json({
      message: "Data spesies berhasil diambil",
      data: formattedData,
    });
  } catch (error) {
    console.error("Internal server error, Error: ", error);
    res.status(500).json({ message: "internal server error" });
  }
};

exports.getSpesiesbyId = async (req, res) => {
  try {
    const data = await prisma.budidaya.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });

    if (data === null) {
      return res.status(404).json({ message: "Spesies not found" });
    }

    res.status(200).json({
      message: "Data satu spesies berhasil diambil",
      data: {
        nama: data.namaSpesies,
        deskripsi: data.deskripsi,
        urlGambar: `${process.env.STORAGE_URL}${data.gambar}`,
      },
    });
  } catch (error) {
    console.error("Internal server error, Error: ", error);
    res.status(500).json({ message: "internal server error" });
  }
};

exports.createSpesies = async (req, res) => {
  const { namaSpesies, deskripsi } = req.body;
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
    return res.status(400).json({ message: "No image uploaded" }); // Kalau gambar belum ada diupload pas penambahan produk
  }
  try {
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `/tanaman/${fileName}`;

    const { error: uploadError } = await supabaseUser.storage
      .from("1mage.storage")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) {
      throw uploadError;
    }

    const imageUrl = `${process.env.STORAGE_URL}${filePath}`;

    const dataInput = {
      namaSpesies,
      deskripsi,
      gambar: filePath,
    };

    await prisma.budidaya.create({
      data: {
        ...dataInput,
        user_id: userId,
        timeAdded: new Date(),
      },
    });

    res.status(201).json({
      message: "Tanaman creation succes",
      data: { dataInput, urlGambar: imageUrl },
    });
  } catch (error) {
    console.error("Internal server error, Error: ", error);
    res.status(500).json({ message: "Failed to add a product", error: error });
  }
};

exports.updateSpesies = async (req, res) => {
  const spesiesId = parseInt(req.params.id);
  const { namaSpesies, deskripsi } = req.body;
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

  try {
    const existSpesies = await prisma.budidaya.findUnique({
      where: { id: tanamanId },
    });

    if (!existSpesies) {
      return res.status(404).json({ message: "Spesies tidak ditemukan" });
    }

    let imagePath = existSpesies.gambar;

    if (imagePath) {
      let path = imagePath;
      if (path.startsWith("/")) {
        path = path.slice(1);
      }

      const { error: deleteError } = await supabaseUser.storage
        .from("1mage.storage")
        .remove([path]);

      console.log("Gambar spesies lama berhasil dihapus");

      if (deleteError) {
        console.error(
          "Gagal menghapus gambar lama dari storage: ",
          deleteError.message
        );
        return res.status(401).json({
          message: "Gagal menghapus gambar spesies lama dari storage",
          error: deleteError,
        });
      }
    }

    if (file) {
      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = `/tanaman/${fileName}`;

      const { error: uploadError } = await supabaseUser.storage
        .from("1mage.storage")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) throw uploadError;

      imagePath = filePath;
    }

    const updateData = {};

    if (namaSpesies !== undefined && namaSpesies !== "")
      updateData.namaSpesies = namaSpesies;
    if (deskripsi !== undefined && deskripsi !== "")
      updateData.deskripsi = deskripsi;
    if (file) updateData.gambar = imagePath;

    await prisma.budidaya.update({
      where: { id: spesiesId },
      data: {
        ...updateData,
        user_id: userId,
      },
    });

    let imageUrl;
    if (file) {
      imageUrl = `${process.env.STORAGE_URL}${updateData.gambar}`;
    } else {
      imageUrl = `${process.env.STORAGE_URL}${existSpesies.gambar}`;
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

exports.deleteSpesies = async (req, res) => {
  const spesiesId = parseInt(req.params.id);
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

  try {
    const spesies = await prisma.budidaya.findUnique({
      where: { id: spesiesId },
    });

    if (!spesies) {
      return res.status(404).json({ message: "Tanaman tidak ditemukan" });
    }

    if (spesies.gambar) {
      let path = spesies.gambar;
      if (path.startsWith("/")) {
        path = path.slice(1);
      }

      const { error: deleteError } = await supabaseUser.storage
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

    await prisma.budidaya.delete({
      where: { id: spesies.id },
    });

    res.status(200).json({ message: "Tanaman berhasil dihapus" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
