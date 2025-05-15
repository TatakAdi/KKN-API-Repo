const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getUserLogged = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await prisma.users.findUnique({ where: { id: userId } });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      fullName: user.fullName,
    });
  } catch (error) {
    console.error("Internal server error, Error: ", error);
    res.status(500).json({ message: "internal server error" });
  }
};
