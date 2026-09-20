import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

// Load environment variables from .env file
dotenv.config();

// Ensure reliable DNS resolution for MongoDB Atlas SRV connection strings
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  console.warn("Could not set custom DNS servers:", e);
}

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB);
    console.log("DB Connected");
  } catch (error) {
    console.error("DB connection error:", error);
    process.exit(1); // Exit process with failure
  }
};