import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  data: Buffer,
  contentType: String
}, { _id: false });

const sweetSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Name is required"], 
    unique: true,
    trim: true,
    minlength: [1, "Name cannot be empty"],
    maxlength: [100, "Name cannot exceed 100 characters"]
  },
  category: { 
    type: String, 
    required: [true, "Category is required"],
    trim: true,
    minlength: [1, "Category cannot be empty"],
    maxlength: [50, "Category cannot exceed 50 characters"]
  },
  price: { 
    type: Number, 
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"]
  },
  quantity: { 
    type: Number, 
    required: [true, "Quantity is required"], 
    default: 0,
    min: [0, "Quantity cannot be negative"],
    validate: {
      validator: Number.isInteger,
      message: "Quantity must be an integer"
    }
  },
  image: imageSchema
}, { timestamps: true });

export default mongoose.model("Sweet", sweetSchema);
