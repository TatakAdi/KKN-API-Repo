const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const supabase = require("../config/supabaseClient");

const prisma = new PrismaClient();

exports.login = async (req, res) => {
  const { fullName, password } = req.body;

  try {
    const user = await prisma.users.findUnique({
      where: { fullName: fullName },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Wrong password or UserName" });
    }

    const email = user.email;

    const {
      data: { session },
      error,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !session) {
      console.error("Login error: ", error);
      return res
        .status(401)
        .json({ message: "Login failed to supabase", error: error });
    }

    const accessToken = session.access_token;

    res.json({
      message: "Login Berhasil",
      accessToken: accessToken,
    });
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
