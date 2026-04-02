require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const budgetService = require('./src/services/budgetService');
const User = require('./src/models/User');

const run = async () => {
    let out = "";
    const log = (...args) => {
        out += args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(" ") + "\n";
    };
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ role: 'student' });
        if (!user) {
            log("No student user found.");
            fs.writeFileSync('output.txt', out);
            process.exit(0);
        }
        log("User:", user._id);
        const res = await budgetService.createOrUpdateBudget(user._id, { amount: 5000, type: 'monthly' });
        log("Budget created/updated:", res);
        const summary = await budgetService.calculateRemainingBudget(user._id);
        log("Summary:", summary);
    } catch (e) {
        log("Error:", e, e.code, e.stack);
    } finally {
        mongoose.disconnect();
        fs.writeFileSync('output.txt', out);
    }
};
run();
