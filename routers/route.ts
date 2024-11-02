import express from 'express';
import { getCurrentUser, loadUsers } from '../dataHandler';
import { Expense, PaymentMethod } from '../interfaces/interface';

const router = express.Router();
const user = getCurrentUser();

router.get('/', (req, res) => {
  res.render('index', { user });
});

router.post('/add-expense', (req, res) => {
  const { description, amount, currency, paymentMethod, category, tags, isIncoming, isPaid } = req.body;

  let paymentMethodDetails: PaymentMethod = { method: paymentMethod };
  if (paymentMethod === 'Credit Card') {
    paymentMethodDetails.cardDetails = {
      lastFourDigits: req.body.lastFourDigits,
      expiryDate: req.body.expiryDate,
    };
  } else if (paymentMethod === 'Bank Transfer') {
    paymentMethodDetails.bankAccountNumber = req.body.bankAccountNumber;
  }

  const expense: Expense = {
    id: user.expenses.length + 1,
    description,
    amount: parseFloat(amount),
    currency,
    date: new Date().toISOString(),
    paymentMethod: paymentMethodDetails,
    isIncoming: isIncoming === 'yes',
    category,
    tags: tags.split(',').map((tag: string) => tag.trim()),
    isPaid: isPaid === 'yes',
  };

  user.expenses.push(expense);
  (loadUsers().map((u) => (u.id === user.id ? user : u)));
  res.redirect('/');
});

export default router;
