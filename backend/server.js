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
const port = process.env.PORT || 4000; // Default to 3000 if PORT is not set

// Middleware
app.use(express.json());
app.use(cors({
    origin: "https://menu-ordering-app-deploy-frontend.vercel.app" // Restrict to frontend domain
}));

// DB connection
connectDB();

// API endpoints
app.use("/api/food", foodRouter);
app.use("/images", express.static('uploads')); // Ensure 'uploads' is included in your deployment
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
