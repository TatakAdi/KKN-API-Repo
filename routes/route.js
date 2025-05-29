const express = require("express");
const { login } = require("../controllers/login");
const { getUserLogged } = require("../controllers/getUserLogged");
const {
  getProduct,
  getProductById,
  postNewProduct,
  updateProductData,
  deleteProductData,
} = require("../controllers/product");
const {
  getTanaman,
  getTanamanbyId,
  createTanaman,
  updateTanaman,
  deleteTanaman,
} = require("../controllers/tanaman");
const authMiddleware = require("../middleware/auth");
const uploadMiddleware = require("../middleware/multer");

const router = express.Router();

// Autentikasi
router.post("/login", login);
router.get("/me", authMiddleware, getUserLogged);

// Produk
router.get("/product", getProduct);
router.get(`/product/:id`, getProductById);
router.post(`/product`, authMiddleware, uploadMiddleware, postNewProduct);
router.put("/product/:id", authMiddleware, uploadMiddleware, updateProductData);
router.delete("/product/:id", deleteProductData);

// Tanaman
router.get("/tanaman", getTanaman);
router.get("/tanaman/:id", getTanamanbyId);
router.post("/tanaman", authMiddleware, uploadMiddleware, createTanaman);
router.put("/tanaman/:id", authMiddleware, uploadMiddleware, updateTanaman);
router.delete("/tanaman/:id", deleteTanaman);

module.exports = router;
