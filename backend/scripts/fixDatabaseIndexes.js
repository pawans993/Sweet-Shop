/**
 * Database Index Cleanup Script
 * 
 * This script removes the old 'email_1' index from the users collection
 * if it exists. This index is a leftover from a previous schema version.
 * 
 * Run this script once to fix the database:
 * node scripts/fixDatabaseIndexes.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const fixIndexes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    // Get all indexes
    const indexes = await usersCollection.indexes();
    console.log("Current indexes:", indexes);

    // Check if email_1 index exists
    const emailIndex = indexes.find(index => index.name === "email_1");
    
    if (emailIndex) {
      console.log("Found old 'email_1' index. Removing it...");
      await usersCollection.dropIndex("email_1");
      console.log("✓ Successfully removed 'email_1' index");
    } else {
      console.log("✓ No 'email_1' index found. Database is clean.");
    }

    // Verify username index exists
    const usernameIndex = indexes.find(index => 
      index.key && index.key.username === 1
    );
    
    if (!usernameIndex) {
      console.log("Creating username index...");
      await usersCollection.createIndex({ username: 1 }, { unique: true });
      console.log("✓ Username index created");
    } else {
      console.log("✓ Username index already exists");
    }

    // Show final indexes
    const finalIndexes = await usersCollection.indexes();
    console.log("\nFinal indexes:", finalIndexes.map(idx => idx.name));

    console.log("\n✓ Database cleanup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error fixing database indexes:", error);
    process.exit(1);
  }
};

fixIndexes();

