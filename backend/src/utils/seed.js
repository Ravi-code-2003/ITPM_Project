const mongoose = require("mongoose");
const User = require("../models/User");
const connectDB = require("../config/db");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Clear existing users (optional - comment out if you want to keep existing users)
    // await User.deleteMany({});
    // console.log("Existing users cleared");

    // Create default admin user
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL || "admin@example.com" });
    
    if (!adminExists) {
      const adminUser = await User.create({
        fullName: "System Administrator",
        email: process.env.ADMIN_EMAIL || "admin@example.com",
        password: process.env.ADMIN_PASSWORD || "Admin123",
        role: "admin",
        isApproved: true,
        status: "approved",
      });
      console.log("✅ Admin user created:", adminUser.email);
    } else {
      console.log("ℹ️ Admin user already exists:", adminExists.email);
    }

    // Create sample student user
    const studentExists = await User.findOne({ email: "student@example.com" });
    
    if (!studentExists) {
      const studentUser = await User.create({
        fullName: "John Student",
        email: "student@example.com",
        password: "Student123",
        role: "student",
        isApproved: true,
        status: "approved",
      });
      console.log("✅ Sample student created:", studentUser.email);
    } else {
      console.log("ℹ️ Sample student already exists:", studentExists.email);
    }

    // Create sample shop owner (pending approval)
    const shopOwnerExists = await User.findOne({ email: "shopowner@example.com" });
    
    if (!shopOwnerExists) {
      const shopOwner = await User.create({
        fullName: "Jane Shop Owner",
        email: "shopowner@example.com",
        password: "ShopOwner123",
        role: "shop-owner",
        shopName: "Campus Food Corner",
        location: "University Main Building",
        proofImage: "https://via.placeholder.com/400x300?text=Shop+License", // Placeholder image
        isApproved: false,
        status: "pending",
      });
      console.log("✅ Sample shop owner created:", shopOwner.email);
    } else {
      console.log("ℹ️ Sample shop owner already exists:", shopOwnerExists.email);
    }

    // Create sample house owner (pending approval)
    const houseOwnerExists = await User.findOne({ email: "houseowner@example.com" });
    
    if (!houseOwnerExists) {
      const houseOwner = await User.create({
        fullName: "Bob House Owner",
        email: "houseowner@example.com",
        password: "HouseOwner123",
        role: "house-owner",
        address: "123 University Street, Colombo 7",
        roomProofImage: "https://via.placeholder.com/400x300?text=Property+Documents", // Placeholder image
        isApproved: false,
        status: "pending",
      });
      console.log("✅ Sample house owner created:", houseOwner.email);
    } else {
      console.log("ℹ️ Sample house owner already exists:", houseOwnerExists.email);
    }

    // Create sample education path (pending approval)
    const educationPathExists = await User.findOne({ email: "education@example.com" });
    
    if (!educationPathExists) {
      const educationPath = await User.create({
        fullName: "Alice Education Manager",
        email: "education@example.com",
        password: "Education123",
        role: "education-path",
        organizationName: "Tech Skills Institute",
        organizationType: "institute",
        organizationEmail: "info@techskills.edu",
        roleProofImage: "https://via.placeholder.com/400x300?text=Organization+Certificate", // Placeholder image
        isApproved: false,
        status: "pending",
      });
      console.log("✅ Sample education path created:", educationPath.email);
    } else {
      console.log("ℹ️ Sample education path already exists:", educationPathExists.email);
    }

    console.log("\n🎉 Seed data creation completed successfully!");
    console.log("\n📋 Login Credentials:");
    console.log("👑 Admin:");
    console.log(`   Email: ${process.env.ADMIN_EMAIL || "admin@example.com"}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || "Admin123"}`);
    console.log("\n👨‍🎓 Student (Auto-approved):");
    console.log("   Email: student@example.com");
    console.log("   Password: Student123");
    console.log("\n🏪 Shop Owner (Pending approval):");
    console.log("   Email: shopowner@example.com");
    console.log("   Password: ShopOwner123");
    console.log("\n🏠 House Owner (Pending approval):");
    console.log("   Email: houseowner@example.com");
    console.log("   Password: HouseOwner123");
    console.log("\n📚 Education Path (Pending approval):");
    console.log("   Email: education@example.com");
    console.log("   Password: Education123");
    console.log("\n💡 Use admin credentials to approve pending users!");

    process.exit(0);

  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
};

// Run the seed function
seedUsers();