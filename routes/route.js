const express = require("express");
const { login } = require("../controllers/login");
const { getUserLogged } = require("../controllers/getUserLogged");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/login", login);
router.get("/me", authMiddleware, getUserLogged);

module.exports = router;
