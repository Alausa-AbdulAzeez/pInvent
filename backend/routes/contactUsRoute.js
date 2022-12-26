const express = require("express");
const { contactUsController } = require("../controllers/contactUsController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, contactUsController);

module.exports = router;
