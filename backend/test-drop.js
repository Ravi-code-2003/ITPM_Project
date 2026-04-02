require('dotenv').config();
const mongoose = require('mongoose');
const Budget = require('./src/models/Budget');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");
        await Budget.collection.dropIndex('studentId_1').catch(e => console.log('Index drop error:', e.message));
        console.log("Index dropped if existed.");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        mongoose.disconnect();
    }
};
run();
