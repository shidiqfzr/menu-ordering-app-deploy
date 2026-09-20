import foodModel from "../models/foodModel.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer Storage with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "menu-ordering-app", // Folder in Cloudinary
    format: async (req, file) => "png", // Specify file format
    public_id: (req, file) => `${Date.now()}_${file.originalname.split('.')[0]}`,
  },
});

const upload = multer({ storage });

// Add food item
const addFood = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Image file is required" });
  }

  // Get the image URL from Cloudinary
  const imageUrl = req.file.path;

  const food = new foodModel({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    category: req.body.category,
    image: imageUrl, // Save Cloudinary URL in the database
    available: req.body.available !== undefined ? req.body.available === 'true' || req.body.available === true : true,
  });

  try {
    await food.save();
    res.json({ success: true, message: "Food Added", data: food });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error adding food" });
  }
};

// Get all food items
const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({});
    res.json({ success: true, data: foods });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error retrieving food list" });
  }
};

// Remove food item
const removeFood = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: "Food ID is required" });
  }

  try {
    const food = await foodModel.findById(id);
    if (!food) {
      return res.status(404).json({ success: false, message: "Food item not found" });
    }

    // Remove the image from Cloudinary
    if (food.image && food.image.includes('cloudinary')) {
      try {
        const publicId = food.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`menu-ordering-app/${publicId}`);
      } catch (imgErr) {
        console.warn("Could not remove old Cloudinary image:", imgErr);
      }
    }

    // Remove the food item from the database
    await foodModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Food Removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error removing food" });
  }
};

// Update food item
const updateFood = async (req, res) => {
  const { id, name, description, price, category, available } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: "Food ID is required" });
  }

  try {
    const food = await foodModel.findById(id);
    if (!food) {
      return res.status(404).json({ success: false, message: "Food item not found" });
    }

    const updateData = {
      name: name !== undefined ? name : food.name,
      description: description !== undefined ? description : food.description,
      price: price !== undefined ? price : food.price,
      category: category !== undefined ? category : food.category,
    };

    if (available !== undefined) {
      updateData.available = available === 'true' || available === true;
    }

    // If new image is uploaded to Cloudinary
    if (req.file) {
      updateData.image = req.file.path;
      try {
        if (food.image && food.image.includes('cloudinary')) {
          const publicId = food.image.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`menu-ordering-app/${publicId}`);
        }
      } catch (imgErr) {
        console.warn("Could not delete old image:", imgErr);
      }
    }

    const updatedFood = await foodModel.findByIdAndUpdate(id, updateData, { new: true });
    res.json({ success: true, message: "Menu makanan berhasil diperbarui!", data: updatedFood });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal memperbarui menu makanan" });
  }
};

// 1-Click Toggle Availability (Tersedia / Stok Habis)
const toggleAvailability = async (req, res) => {
  const { id, available } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: "Food ID is required" });
  }

  try {
    const food = await foodModel.findById(id);
    if (!food) {
      return res.status(404).json({ success: false, message: "Food item not found" });
    }

    const currentAvailability = food.available !== false;
    const newStatus = available !== undefined ? Boolean(available) : !currentAvailability;

    food.available = newStatus;
    await food.save();

    res.json({
      success: true,
      message: `Status "${food.name}" berhasil diubah menjadi: ${newStatus ? 'Tersedia' : 'Stok Habis'}`,
      data: food,
      available: newStatus,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal mengubah status ketersediaan menu" });
  }
};

export { addFood, listFood, removeFood, updateFood, toggleAvailability, upload };
