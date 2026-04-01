const express = require('express');
const { protect } = require('../middleware/auth');
const Transaction = require('../controllers/transactionController');
const router = express.Router();

router.use(protect);

router.post('/', Transaction.createTransaction);
router.get('/:userId', Transaction.getTransactionsByUser);
router.get('/summary/:userId', Transaction.getSummaryByUser);

module.exports = router;
