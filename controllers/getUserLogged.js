const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getUserLogged = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await prisma.users.findUnique({ where: { auth_id: userId } });

    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    res.json({
      fullName: user.fullName,
      email: user.email,
    });
  } catch (error) {
    console.error("Internal server error, Error: ", error);
    res.status(500).json({ message: "internal server error" });
  }
};
