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
  getSpesies,
  getSpesiesbyId,
  deleteSpesies,
  createSpesies,
  updateSpesies,
} = require("../controllers/tanaman");
const {
  getGaleri,
  getGaleriById,
  createGaleri,
  updateGaleri,
  deleteGaleri,
} = require("../controllers/galeri");
const {
  getPrestasi,
  getPrestasiById,
  createPrestasi,
  updatePrestasi,
  deletePrestasi,
} = require("../controllers/prestasi");
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
router.get("/budidaya", getSpesies);
router.get("/budidaya/:id", getSpesiesbyId);
router.post("/budidaya", authMiddleware, uploadMiddleware, createSpesies);
router.put("/budidaya/:id", authMiddleware, uploadMiddleware, updateSpesies);
router.delete("/budidaya/:id", deleteSpesies);

// Galeri
router.get("/galeri", getGaleri);
router.get("/galeri/:id", getGaleriById);
router.post("/galeri", authMiddleware, uploadMiddleware, createGaleri);
router.put("/galeri/:id", authMiddleware, uploadMiddleware, updateGaleri);
router.delete("/galeri/:id", authMiddleware, deleteGaleri);

// Prestasi
router.get("/prestasi", getPrestasi);
router.get("/prestasi/:id", getPrestasiById);
router.post("/prestasi", authMiddleware, createPrestasi);
router.put("/prestasi/:id", authMiddleware, updatePrestasi);
router.delete("/prestasi/:id", authMiddleware, deletePrestasi);

module.exports = router;
