import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import 'dotenv/config';

// App config
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 4000; // Default to 4000 if PORT is not set

// CORS setup supporting Vercel deployments, custom domains, and local development
const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow mobile apps, curl, Postman, server-to-server
  if (
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1") ||
    origin.startsWith("http://192.168.") ||
    origin.startsWith("http://10.") ||
    origin.startsWith("http://172.")
  ) {
    return true;
  }
  // Allow all Vercel deployments (production and preview URLs)
  if (origin.endsWith(".vercel.app")) {
    return true;
  }
  // Allow explicitly configured frontend and admin URLs
  const configuredOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    "https://bujang-cafe.vercel.app"
  ].filter(Boolean).map(url => url.replace(/\/$/, ""));

  return configuredOrigins.includes(origin.replace(/\/$/, ""));
};

const corsOptions = {
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
};

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin));
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket connection handling
io.on("connection", (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Attach io instance to express app so controllers can access via req.app.get("io")
app.set("io", io);

// Middleware
app.use(express.json());
app.use(cors(corsOptions));

// Ensure DB connection before handling requests (crucial for serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB connection error in request:", err);
    res.status(500).json({ success: false, message: "Database connection failed" });
  }
});

// API endpoints
app.use("/api/food", foodRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

// Root endpoint
app.get("/", (req, res) => {
    res.send("API Working");
});

// Start server (when run directly or locally)
if (process.env.NODE_ENV !== "test") {
  server.listen(port, () => {
    console.log(`Server started on port ${port} with Socket.IO enabled`);
  });
}

export default app;
