import express from "express";
import { addFood, listFood, removeFood, updateFood, toggleAvailability, upload } from "../controllers/foodController.js";
import authMiddleware, { requireRoles } from "../middleware/auth.js";

const foodRouter = express.Router();

// Add a food item with an image upload (Manager/Owner only)
foodRouter.post("/add", authMiddleware, requireRoles('manager', 'admin'), upload.single("image"), addFood);

// Update a food item with optional image upload (Manager/Owner only)
foodRouter.post("/update", authMiddleware, requireRoles('manager', 'admin'), upload.single("image"), updateFood);

// Toggle food availability (Tersedia / Stok Habis - Open to Kasir & Manager)
foodRouter.post("/toggle-availability", authMiddleware, toggleAvailability);

// List all food items
foodRouter.get("/list", listFood);

// Remove a food item (Manager/Owner only)
foodRouter.post("/remove", authMiddleware, requireRoles('manager', 'admin'), removeFood);

export default foodRouter;
