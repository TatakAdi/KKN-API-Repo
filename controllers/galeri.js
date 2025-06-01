const { PrismaClient } = require("@prisma/client");
const supabase = require("../config/supabaseClient");

const prisma = new PrismaClient();

exports.getGaleri = async (req, res) => {
    try {
        const data = await prisma.galeri.findMany({
        orderBy: {
            timeAdded: 'desc'
        }
        });

        if (data.length === 0) {
        return res.status(404).json({ message: "Data galeri kosong" });
        }

        const formattedData = data.map((item) => ({
        ...item,
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
    const file = req.file;
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized - user ID missing" });
    }

    if (!file) {
        return res.status(400).json({ message: "No image uploaded" });
    }

    try {
        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = `/galeri/${fileName}`;

        const { error: uploadError } = await supabase.storage
        .from("1mage.storage")
        .upload(filePath, file.buffer, {
            contentType: file.mimetype,
        });

        if (uploadError) {
        throw uploadError;
        }

        const imageUrl = `${process.env.STORAGE_URL}${filePath}`;

        const dataGaleri = await prisma.galeri.create({
        data: {
            gambar: filePath,
            user_id: userId,
            timeAdded: new Date(),
        },
        });

        res.status(201).json({
        message: "Foto galeri berhasil ditambahkan",
        data: { 
            ...dataGaleri, 
            urlGambar: imageUrl 
        },
        });
    } catch (error) {
        console.error("Internal server error, Error: ", error);
        res.status(500).json({ message: "Gagal menambahkan foto galeri", error: error });
    }
};

exports.updateGaleri = async (req, res) => {
    const galeriId = parseInt(req.params.id);
    const file = req.file;
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized - user ID missing" });
    }

    if (!file) {
        return res.status(400).json({ message: "No image uploaded" });
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

        const { error: deleteError } = await supabase.storage
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

        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = `/galeri/${fileName}`;

        const { error: uploadError } = await supabase.storage
        .from("1mage.storage")
        .upload(filePath, file.buffer, {
            contentType: file.mimetype,
        });

        if (uploadError) throw uploadError;

        const updated = await prisma.galeri.update({
        where: { id: galeriId },
        data: {
            gambar: filePath,
            user_id: userId,
        },
        });

        const imageUrl = `${process.env.STORAGE_URL}${updated.gambar}`;

        res.status(200).json({
        message: "Foto galeri berhasil diperbarui",
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

exports.deleteGaleri = async (req, res) => {
    const galeriId = parseInt(req.params.id);

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

        const { error: deleteError } = await supabase.storage
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