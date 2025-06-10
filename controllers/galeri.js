const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");

const prisma = new PrismaClient();

exports.getGaleri = async (req, res) => {
  try {
    const data = await prisma.galeri.findMany({
      orderBy: {
        timeAdded: "desc",
      },
    });

    if (data.length === 0) {
      return res.status(404).json({ message: "Data galeri kosong" });
    }

    const formattedData = data.map((item) => ({
      id: item.id,
      altText: item.altText,
      timeAdded: item.timeAdded,
      urlGambar: `${process.env.STORAGE_URL}${item.gambar}`,
    }));

    res.status(200).json({
      message: "Data galeri berhasil diambil",
      data: formattedData,
    });
  } catch (error) {
    console.error("Internal server error, Error: ", error);
    res.status(500).json({ message: "internal server error" });
  }
};

exports.getGaleriById = async (req, res) => {
  try {
    const data = await prisma.galeri.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });

    if (!data) {
      return res.status(404).json({ message: "Foto galeri tidak ditemukan" });
    }

    res.status(200).json({
      message: "Data foto galeri berhasil diambil",
      data: {
        id: data.id,
        altText: data.altText,
        urlGambar: `${process.env.STORAGE_URL}${data.gambar}`,
        timeAdded: data.timeAdded,
      },
    });
  } catch (error) {
    console.error("Internal server error, Error: ", error);
    res.status(500).json({ message: "internal server error" });
  }
};

exports.createGaleri = async (req, res) => {
  const { altText } = req.body;
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
    return res.status(400).json({ message: "No image uploaded" });
  }

  try {
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `/galeri/${fileName}`;

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
      gambar: filePath,
      altText: altText || null, // Bisa kosong jika tidak diisi
    };

    const dataGaleri = await prisma.galeri.create({
      data: {
        ...dataInput,
        user_id: userId,
        timeAdded: new Date(),
      },
    });

    res.status(201).json({
      message: "Foto galeri berhasil ditambahkan",
      data: {
        ...dataInput,
        timeAdded: dataGaleri.timeAdded,
        urlGambar: imageUrl,
      },
    });
  } catch (error) {
    console.error("Internal server error, Error: ", error);
    res
      .status(500)
      .json({ message: "Gagal menambahkan foto galeri", error: error });
  }
};

exports.updateGaleri = async (req, res) => {
  const galeriId = parseInt(req.params.id);
  const { altText } = req.body;
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
    const existGaleri = await prisma.galeri.findUnique({
      where: { id: galeriId },
    });

    if (!existGaleri) {
      return res.status(404).json({ message: "Foto galeri tidak ditemukan" });
    }

    if (existGaleri.gambar) {
      let path = existGaleri.gambar;
      if (path.startsWith("/")) {
        path = path.slice(1);
      }

      const { error: deleteError } = await supabaseUser.storage
        .from("1mage.storage")
        .remove([path]);

      if (deleteError) {
        console.error(
          "Gagal menghapus gambar lama dari storage: ",
          deleteError.message
        );
      } else {
        console.log("Gambar lama berhasil dihapus");
      }
    }

    if (file) {
      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = `/galeri/${fileName}`;

      const { error: uploadError } = await supabaseUser.storage
        .from("1mage.storage")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) throw uploadError;
    }

    const updateData = {};

    if (altText !== undefined && altText !== "") updateData.altText = altText;
    if (file) updateData.gambar = imagePath;

    const updated = await prisma.galeri.update({
      where: { id: galeriId },
      data: {
        ...updateData,
        user_id: userId,
      },
    });

    let imageUrl;
    if (file) {
      imageUrl = `${process.env.STORAGE_URL}${updated.gambar}`;
    } else {
      imageUrl = `${process.env.STORAGE_URL}${existGaleri.gambar}`;
    }

    res.status(200).json({
      message: "Foto galeri berhasil diperbarui",
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

exports.deleteGaleri = async (req, res) => {
  const galeriId = parseInt(req.params.id);
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
    const galeri = await prisma.galeri.findUnique({
      where: { id: galeriId },
    });

    if (!galeri) {
      return res.status(404).json({ message: "Foto galeri tidak ditemukan" });
    }

    if (galeri.gambar) {
      let path = galeri.gambar;
      if (path.startsWith("/")) {
        path = path.slice(1);
      }

      const { error: deleteError } = await supabaseUser.storage
        .from("1mage.storage")
        .remove([path]);

      if (deleteError) {
        console.error(
          "Gagal menghapus gambar dari storage: ",
          deleteError.message
        );
        return res.status(401).json({
          message: "Gagal menghapus gambar dari storage",
          error: deleteError,
        });
      } else {
        console.log("Gambar berhasil dihapus");
      }
    }

    await prisma.galeri.delete({
      where: { id: galeriId },
    });

    res.status(200).json({ message: "Foto galeri berhasil dihapus" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
