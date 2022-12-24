const express = require("express");
const {
  createProduct,
  getAllProducts,
  getProduct,
  deleteProduct,
  updateProduct,
} = require("../controllers/productController");
const protect = require("../middleware/authMiddleware");
const upload = require("../utils/fileUploads");

const router = express.Router();

// ROUTES
router.post("/createproduct", protect, upload.single("image"), createProduct);
router.get("/", protect, getAllProducts);
router.get("/:productId", protect, getProduct);
router.delete("/:productId", protect, deleteProduct);
router.patch("/:productId", protect, upload.single("image"), updateProduct);

module.exports = router;
