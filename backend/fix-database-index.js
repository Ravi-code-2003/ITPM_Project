const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const fixDatabaseIndex = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Access the roomrequests collection
    const collection = mongoose.connection.collection("roomrequests");
    const indexes = await collection.indexes();

    console.log("\n📋 Current indexes:");
    indexes.forEach((idx, i) => {
      console.log(`${i}: ${idx.name}`, idx);
    });

    // Find and drop the unique index
    const legacyIndex = indexes.find(
      (idx) => idx.unique && idx.key?.room === 1 && idx.key?.student === 1
    );

    if (legacyIndex) {
      console.log(`\n🗑️  Dropping legacy index: ${legacyIndex.name}`);
      await collection.dropIndex(legacyIndex.name);
      console.log(`✅ Successfully dropped index: ${legacyIndex.name}`);
    } else {
      console.log("\n✅ No legacy unique index found (already clean)");
    }

    // Verify new state
    const newIndexes = await collection.indexes();
    console.log("\n📋 Indexes after fix:");
    newIndexes.forEach((idx, i) => {
      console.log(`${i}: ${idx.name}`, idx);
    });

    console.log("\n✨ Database index fix complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

fixDatabaseIndex();
