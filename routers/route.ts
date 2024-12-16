import express from 'express';
import { createUser,getExpenses, addExpenseForUser,checkBudgetNotification , addExpense, getFilteredExpenses, updateExpense, deleteExpense, userCollection, getUser } from '../database';
import { Expense, PaymentMethod } from '../types';
import { ObjectId } from 'mongodb';

export function createRouter() {
  const router = express.Router();

  router.get('/', async (req, res) => {
    res.render('index');
  });
  

  router.get('/add-expense', async (req, res) => {
    const user = await getCurrentUser();
    res.render('add-expense', {user});
  });

  router.get('/expenses', async (req, res) => {
    const filters = {
        search: req.query.search || '',
        category: req.query.category || '',
        isIncoming: req.query.isIncoming || undefined,
    };

    const expenses = await getFilteredExpenses(filters);
    const user = await getCurrentUser();
    res.render('expenses', { expenses, user });
});



  router.post('/add-expense', async (req, res) => {
    const { description, amount, currency, paymentMethod, category, tags, isIncoming, isPaid } = req.body;

    const user = await getCurrentUser();

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
      _id: new ObjectId(),
      description,
      amount: parseFloat(amount),
      currency,
      date: new Date().toISOString(),
      paymentMethod: paymentMethodDetails,
      isIncoming: isIncoming === 'true',
      category,
      tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
      isPaid: isPaid === 'true',
    };

    await addExpense(expense);
        user.expenses.push(expense._id);
        res.redirect('/expenses');
  });

  router.get('/edit-expense/:id', async (req, res) => {
    try {
      const expenseId = req.params.id;
  
      if (!ObjectId.isValid(expenseId)) {
        res.status(400).send('Unvalid ID-format');
        return;
      }
  
      const expenseObjectId = new ObjectId(expenseId);
  
      const expenses = await getFilteredExpenses({ search: '', category: '', isIncoming: undefined });
      const expense = expenses.find((e) => e._id.equals(expenseObjectId));
  
      if (!expense) {
        res.status(404).send('Expense not found');
        return;
      }
  
      res.render('edit-expense', { expense });
    } catch (error) {
      console.error('Error retrieving expense:', error);
      res.status(500).send('Something went wrong.');
    }
  });
  
  router.post('/edit-expense/:id', async (req, res) => {
    const expenseId = new ObjectId(req.params.id);
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

    const updatedExpense: Partial<Expense> = {
      description,
      amount: parseFloat(amount),
      currency,
      paymentMethod: paymentMethodDetails,
      isIncoming: isIncoming === 'true',
      category,
      tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
      isPaid: isPaid === 'true',
    };

    await updateExpense(expenseId, updatedExpense);
    res.redirect('/expenses');
});


 // Verwijder een uitgave
 router.post('/delete-expense/:id', async (req, res) => {
  const expenseId = new ObjectId(req.params.id);
  await deleteExpense(expenseId);
  res.redirect('/expenses');
});




  return router;
}


