import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import sweetRoutes from "./routes/sweetRoutes.js";

dotenv.config();

// Check for required environment variables
if (!process.env.JWT_SECRET) {
  console.error("ERROR: JWT_SECRET is not defined in environment variables");
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error("ERROR: MONGODB_URI is not defined in environment variables");
  process.exit(1);
}

connectDB();

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json()); // for JSON bodies
app.use(express.urlencoded({ extended: true })); // for form data

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/sweets", sweetRoutes);

app.get("/", (req, res) => res.send("Sweet Shop API Running"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }
  
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format" });
  }
  
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File too large. Maximum size is 5MB" });
    }
    return res.status(400).json({ message: "File upload error" });
  }
  
  res.status(err.status || 500).json({
    message: err.message || "Server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
