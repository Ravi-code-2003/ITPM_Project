const Transaction = require('../models/Transaction');

const createTransaction = async (req, res) => {
  try {
    const userId = req.body.userId || req.user._id;
    const { type, category, amount, description, date } = req.body;

    if (!['income','expense'].includes(type)) return res.status(400).json({ message: 'Invalid transaction type' });
    if (!amount || typeof amount !== 'number') return res.status(400).json({ message: 'Amount is required' });

    const txn = new Transaction({ userId, type, category, amount, description, date: date || new Date() });
    await txn.save();
    res.status(201).json({ success: true, transaction: txn });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTransactionsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const txns = await Transaction.find({ userId }).sort({ date: -1 }).limit(200).lean();
    res.json({ success: true, transactions: txns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSummaryByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const txns = await Transaction.find({ userId }).sort({ date: -1 }).lean();
    const totalIncome = txns.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
    const totalExpenses = txns.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
    const remainingBudget = totalIncome - totalExpenses;
    res.json({ success: true, summary: { totalIncome, totalExpenses, remainingBudget, last10Transactions: txns.slice(0,10) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createTransaction, getTransactionsByUser, getSummaryByUser };
