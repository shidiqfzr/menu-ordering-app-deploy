import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import 'dotenv/config';

// App config
const app = express();
const port = process.env.PORT || 4000; // Default to 4000 if PORT is not set

// CORS setup based on environment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? "https://bujang-cafe.vercel.app"  // Production frontend URL
    : "http://localhost:5173"  // Local development URL
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions));

// DB connection
connectDB();

// API endpoints
app.use("/api/food", foodRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

// Root endpoint
app.get("/", (req, res) => {
    res.send("API Working");
});

// Start server
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
