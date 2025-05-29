const supabase = require("../config/supabaseClient");

module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized - Token missing" });
  }

  const token = authHeader.split(" ")[1];

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    console.error("Supabase token error:", error);
    return res.status(401).json({ message: "Unauthorized or invalid token" });
  }

  req.userId = data.user.id;
  next();
};
