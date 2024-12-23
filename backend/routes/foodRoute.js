import express from "express";
import { addFood, listFood, removeFood, upload } from "../controllers/foodController.js";

const foodRouter = express.Router();

// Add a food item with an image upload
foodRouter.post("/add", upload.single("image"), addFood);

// List all food items
foodRouter.get("/list", listFood);

// Remove a food item
foodRouter.post("/remove", removeFood);

export default foodRouter;
