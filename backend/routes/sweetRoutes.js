import express from "express";
import multer from "multer";
import {
  addSweet,
  getSweets,
  searchSweets,
  updateSweet,
  deleteSweet,
  purchaseSweet,
  restockSweet
} from "../controllers/sweetController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Configure multer with file type filtering
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

router.get("/", protect, getSweets);
router.get("/search", protect, searchSweets);

router.post("/", protect, upload.single("image"), addSweet);
router.put("/:id", protect, upload.single("image"), updateSweet);
router.delete("/:id", protect, adminOnly, deleteSweet);

router.post("/:id/purchase", protect, purchaseSweet);
router.post("/:id/restock", protect, adminOnly, restockSweet);

export default router;
