import Sweet from "../models/sweetModel.js"
import mongoose from "mongoose";

const toDataURL = (image) => {
  if (!image || !image.data) return null;
  const base64 = image.data.toString("base64");
  return `data:${image.contentType};base64,${base64}`;
};

// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Validate image file type
const isValidImageType = (mimetype) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(mimetype);
};

export const addSweet = async (req, res) => {
  try {
    const { name, category, price, quantity } = req.body;
    
    // Validation
    if (!name || !category || price == null || quantity == null) {
      return res.status(400).json({ message: "Missing required fields: name, category, price, quantity" });
    }
    
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: "Name must be a non-empty string" });
    }
    
    if (typeof category !== 'string' || category.trim().length === 0) {
      return res.status(400).json({ message: "Category must be a non-empty string" });
    }
    
    const priceNum = Number(price);
    const quantityNum = Number(quantity);
    
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ message: "Price must be a non-negative number" });
    }
    
    if (isNaN(quantityNum) || quantityNum < 0 || !Number.isInteger(quantityNum)) {
      return res.status(400).json({ message: "Quantity must be a non-negative integer" });
    }
    
    // Validate image if provided
    if (req.file) {
      if (!isValidImageType(req.file.mimetype)) {
        return res.status(400).json({ 
          message: "Invalid image type. Allowed types: JPEG, PNG, GIF, WebP" 
        });
      }
    }

    const exists = await Sweet.findOne({ name: name.trim() });
    if (exists) {
      return res.status(409).json({ message: "Sweet with this name already exists" });
    }

    const sweetData = { 
      name: name.trim(), 
      category: category.trim(), 
      price: priceNum, 
      quantity: quantityNum 
    };

    if (req.file) {
      sweetData.image = { data: req.file.buffer, contentType: req.file.mimetype };
    }

    const sweet = await Sweet.create(sweetData);
    const result = sweet.toObject();
    result.imageUrl = toDataURL(result.image);
    delete result.image;
    res.status(201).json(result);
  } catch (err) {
    console.error("Add sweet error:", err);
    
    if (err.code === 11000) {
      return res.status(409).json({ message: "Sweet with this name already exists" });
    }
    
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    
    res.status(500).json({ message: "Server error" });
  }
};

export const getSweets = async (req, res) => {
  try {
    const sweets = await Sweet.find().sort({ createdAt: -1 });
    const out = sweets.map(sweet => {
      const o = sweet.toObject();
      o.imageUrl = toDataURL(o.image);
      delete o.image;
      return o;
    });
    res.json(out);
  } catch (err) {
    console.error("Get sweets error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const searchSweets = async (req, res) => {
  try {
    const { name, category, minPrice, maxPrice } = req.query;
    const q = {};

    if (name) {
      q.name = { $regex: name.trim(), $options: "i" };
    }
    
    if (category) {
      q.category = { $regex: category.trim(), $options: "i" };
    }
    
    if (minPrice || maxPrice) {
      q.price = {};
      if (minPrice) {
        const min = Number(minPrice);
        if (isNaN(min) || min < 0) {
          return res.status(400).json({ message: "minPrice must be a non-negative number" });
        }
        q.price.$gte = min;
      }
      if (maxPrice) {
        const max = Number(maxPrice);
        if (isNaN(max) || max < 0) {
          return res.status(400).json({ message: "maxPrice must be a non-negative number" });
        }
        q.price.$lte = max;
      }
      if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
        return res.status(400).json({ message: "minPrice cannot be greater than maxPrice" });
      }
    }

    const sweets = await Sweet.find(q).sort({ createdAt: -1 });
    const out = sweets.map(sweet => {
      const o = sweet.toObject();
      o.imageUrl = toDataURL(o.image);
      delete o.image;
      return o;
    });
    res.json(out);
  } catch (err) {
    console.error("Search sweets error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSweet = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid sweet ID format" });
    }
    
    const payload = {};
    const allowed = ["name", "category", "price", "quantity"];
    
    // Handle FormData - fields come as strings from multipart/form-data
    allowed.forEach(k => {
      if (req.body[k] !== undefined && req.body[k] !== '') {
        if (k === 'price' || k === 'quantity') {
          const num = Number(req.body[k]);
          if (isNaN(num) || num < 0) {
            throw new Error(`${k} must be a non-negative number`);
          }
          if (k === 'quantity' && !Number.isInteger(num)) {
            throw new Error("Quantity must be an integer");
          }
          payload[k] = num;
        } else {
          const str = String(req.body[k]).trim();
          if (str.length === 0) {
            throw new Error(`${k} cannot be empty`);
          }
          payload[k] = str;
        }
      }
    });

    // Validate image if provided
    if (req.file) {
      if (!isValidImageType(req.file.mimetype)) {
        return res.status(400).json({ 
          message: "Invalid image type. Allowed types: JPEG, PNG, GIF, WebP" 
        });
      }
      payload.image = { data: req.file.buffer, contentType: req.file.mimetype };
    }
    
    // Check if name already exists (if name is being updated)
    if (payload.name) {
      const exists = await Sweet.findOne({ 
        name: payload.name, 
        _id: { $ne: id } 
      });
      if (exists) {
        return res.status(409).json({ message: "Sweet with this name already exists" });
      }
    }

    const sweet = await Sweet.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!sweet) {
      return res.status(404).json({ message: "Sweet not found" });
    }

    const o = sweet.toObject();
    o.imageUrl = toDataURL(o.image);
    delete o.image;
    res.json(o);
  } catch (err) {
    console.error("Update sweet error:", err);
    
    if (err.message && err.message.includes("must be")) {
      return res.status(400).json({ message: err.message });
    }
    
    if (err.code === 11000) {
      return res.status(409).json({ message: "Sweet with this name already exists" });
    }
    
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteSweet = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid sweet ID format" });
    }
    
    const sweet = await Sweet.findByIdAndDelete(id);
    if (!sweet) {
      return res.status(404).json({ message: "Sweet not found" });
    }
    res.json({ message: "Sweet deleted successfully" });
  } catch (err) {
    console.error("Delete sweet error:", err);
    
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    res.status(500).json({ message: "Server error" });
  }
};

export const purchaseSweet = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid sweet ID format" });
    }
    
    const sweet = await Sweet.findById(id);
    if (!sweet) {
      return res.status(404).json({ message: "Sweet not found" });
    }
    
    if (sweet.quantity <= 0) {
      return res.status(400).json({ message: "Sweet is out of stock" });
    }

    sweet.quantity -= 1;
    await sweet.save();
    
    const o = sweet.toObject();
    o.imageUrl = toDataURL(o.image);
    delete o.image;
    res.json(o);
  } catch (err) {
    console.error("Purchase sweet error:", err);
    
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    res.status(500).json({ message: "Server error" });
  }
};

export const restockSweet = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid sweet ID format" });
    }
    
    // Validate amount
    if (amount === undefined || amount === null || amount === '') {
      return res.status(400).json({ message: "Amount is required" });
    }
    
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0 || !Number.isInteger(amountNum)) {
      return res.status(400).json({ message: "Amount must be a positive integer" });
    }

    const sweet = await Sweet.findById(id);
    if (!sweet) {
      return res.status(404).json({ message: "Sweet not found" });
    }

    sweet.quantity += amountNum;
    await sweet.save();

    const o = sweet.toObject();
    o.imageUrl = toDataURL(o.image);
    delete o.image;
    res.json(o);
  } catch (err) {
    console.error("Restock sweet error:", err);
    
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    res.status(500).json({ message: "Server error" });
  }
};
