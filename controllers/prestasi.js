const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

exports.getPrestasi = async (req, res) => {
    try {
        const data = await prisma.prestasi.findMany({
        orderBy: {
            timeAdded: 'desc'
        }
        });

        if (data.length === 0) {
        return res.status(404).json({ message: "Data prestasi kosong" });
        }

        res.status(200).json({
        message: "Data prestasi berhasil diambil",
        data: data,
        });
    } catch (error) {
        console.error("Internal server error, Error: ", error);
        res.status(500).json({ message: "internal server error" });
    }
};

exports.getPrestasiById = async (req, res) => {
    try {
        const data = await prisma.prestasi.findUnique({
        where: {
            id: parseInt(req.params.id),
        },
        });

        if (!data) {
        return res.status(404).json({ message: "Prestasi tidak ditemukan" });
        }

        res.status(200).json({
        message: "Data prestasi berhasil diambil",
        data: {
            id: data.id,
            namaPenghargaan: data.namaPenghargaan,
            pemberiPenghargaan: data.pemberiPenghargaan,
            timeAdded: data.timeAdded,
        },
        });
    } catch (error) {
        console.error("Internal server error, Error: ", error);
        res.status(500).json({ message: "internal server error" });
    }
};

exports.createPrestasi = async (req, res) => {
    const { namaPenghargaan, pemberiPenghargaan } = req.body;
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized - user ID missing" });
    }

    if (!namaPenghargaan || !pemberiPenghargaan) {
        return res.status(400).json({ 
        message: "Nama penghargaan dan pemberi penghargaan wajib diisi" 
        });
    }

    try {
        const dataPrestasi = await prisma.prestasi.create({
        data: {
            namaPenghargaan,
            pemberiPenghargaan,
            user_id: userId,
            timeAdded: new Date(),
        },
        });

        res.status(201).json({
        message: "Prestasi berhasil ditambahkan",
        data: dataPrestasi,
        });
    } catch (error) {
        console.error("Internal server error, Error: ", error);
        res.status(500).json({ message: "Gagal menambahkan prestasi", error: error });
    }
};

exports.updatePrestasi = async (req, res) => {
    const prestasiId = parseInt(req.params.id);
    const { namaPenghargaan, pemberiPenghargaan } = req.body;
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized - user ID missing" });
    }

    try {
        const existPrestasi = await prisma.prestasi.findUnique({
        where: { id: prestasiId },
        });

        if (!existPrestasi) {
        return res.status(404).json({ message: "Prestasi tidak ditemukan" });
        }

        const updateData = {};

        if (namaPenghargaan !== undefined) updateData.namaPenghargaan = namaPenghargaan;
        if (pemberiPenghargaan !== undefined) updateData.pemberiPenghargaan = pemberiPenghargaan;

        if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ 
            message: "Tidak ada data yang akan diperbarui" 
        });
        }

        const updated = await prisma.prestasi.update({
        where: { id: prestasiId },
        data: {
            ...updateData,
            user_id: userId,
        },
        });

        res.status(200).json({
        message: "Data prestasi berhasil diperbarui",
        data: updated,
        });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.deletePrestasi = async (req, res) => {
    const prestasiId = parseInt(req.params.id);

    try {
        const prestasi = await prisma.prestasi.findUnique({
        where: { id: prestasiId },
        });

        if (!prestasi) {
        return res.status(404).json({ message: "Prestasi tidak ditemukan" });
        }

        await prisma.prestasi.delete({
        where: { id: prestasiId },
        });

        res.status(200).json({ message: "Prestasi berhasil dihapus" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};