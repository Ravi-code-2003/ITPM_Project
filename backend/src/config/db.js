const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined. Create backend/.env from backend/.env.example and set a valid MongoDB connection string.");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected ✅");

    // Remove legacy unique index that blocked multiple requests per room/student.
    const roomRequestsCollection = mongoose.connection.collection("roomrequests");
    const indexes = await roomRequestsCollection.indexes();
    const legacyUniqueIndex = indexes.find(
      (index) => index.unique && index.key?.room === 1 && index.key?.student === 1
    );

    if (legacyUniqueIndex) {
      await roomRequestsCollection.dropIndex(legacyUniqueIndex.name);
      console.log(`Removed legacy index: ${legacyUniqueIndex.name} ✅`);
    }
  } catch (error) {
    console.error("MongoDB connection failed ❌", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
