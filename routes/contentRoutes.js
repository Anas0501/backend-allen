const express = require("express");
const router = express.Router();
const {
  createContent,
  getAllContent,
  getContentBySlug,
  getContentById,
  updateContent,
  deleteContent,
} = require("../controllers/contentController");

const { protect, hasContentAccess } = require("../middleware/auth");

// Public routes
router.get("/", getAllContent);
router.get("/slug/:slug", getContentBySlug);
router.get("/:id", getContentById);

// Protected routes (requires content access)
router.post("/", protect, hasContentAccess, createContent);
router.put("/:id", protect, hasContentAccess, updateContent);
router.delete("/:id", protect, hasContentAccess, deleteContent);

module.exports = router;
