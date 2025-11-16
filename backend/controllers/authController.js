import User from "../models/userModel.js"
import { generateToken } from "../config/jwt.js";

export const register = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    // Validation
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    if (username.trim().length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    
    // Validate role if provided
    if (role && !["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'" });
    }

    const exists = await User.findOne({ username: username.trim() });
    if (exists) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const user = await User.create({ 
      username: username.trim(), 
      password, 
      role: role || "user" 
    });
    
    const token = generateToken(user);
    return res.status(201).json({ 
      token, 
      user: { id: user._id, username: user.username, role: user.role } 
    });
  } catch (err) {
    console.error("Register error:", err);
    
    // Handle duplicate key errors (MongoDB E11000)
    if (err.code === 11000) {
      // Check if it's a username duplicate or email index issue
      if (err.keyPattern?.username) {
        return res.status(409).json({ message: "Username already taken" });
      }
      // Handle old email index issue
      if (err.keyPattern?.email) {
        // This is a database index issue - try to handle gracefully
        console.warn("Database has old email index. Consider running database cleanup script.");
        return res.status(409).json({ message: "Username already taken or database configuration issue" });
      }
      return res.status(409).json({ message: "Username already taken" });
    }
    
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    
    return res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);
    return res.json({ 
      token, 
      user: { id: user._id, username: user.username, role: user.role } 
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
