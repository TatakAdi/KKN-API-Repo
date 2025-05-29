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
router.put("/product/:id", uploadMiddleware, updateProductData);
router.delete("/product/:id", deleteProductData);

module.exports = router;
