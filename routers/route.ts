import express from 'express';
import { createUser,getExpenses, addExpenseForUser,checkBudgetNotification , addExpense, getFilteredExpenses, updateExpense, deleteExpense, userCollection, getUser, getUserByUsername } from '../database';
import { Expense, PaymentMethod, User } from '../types';
import { ObjectId } from 'mongodb';

export function createRouter() {
  const router = express.Router();

  router.get('/', async (req, res) => {
    res.render('index');
  });
  

  router.get('/add-expense', async (req, res) => {
    const userSession = req.session.user;
  
    // If user is not logged in, redirect to login
    if (!userSession) {
      return res.redirect('/login');
    }
  
    try {
      const user = await getUserByUsername(userSession.username);
      res.render('add-expense', { user });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.redirect('/login');
    }
  });

  router.get('/expenses', async (req, res) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    const filters = {
        search: req.query.search || '',
        category: req.query.category || '',
        isIncoming: req.query.isIncoming || undefined,
    };

    const expenses = await getFilteredExpenses(filters);
    const user = req.session.user;
    res.render('expenses', { expenses, user });
});



router.post('/add-expense', async (req, res) => {
  const userSession = req.session.user;

  // Check if the user is logged in
  if (!userSession) {
    return res.redirect('/login');  // Redirect to login if the user is not logged in
  }

  try {
    const { description, amount, currency, paymentMethod, category, tags, isIncoming, isPaid } = req.body;

    // Fetch the user from the database using the session username
    const user = await getUserByUsername(userSession.username);

    // If no user is found, redirect to login
    if (!user) {
      return res.redirect('/login');
    }

    let paymentMethodDetails: PaymentMethod = { method: paymentMethod };

    // Handle different payment methods
    if (paymentMethod === 'Credit Card') {
      paymentMethodDetails.cardDetails = {
        lastFourDigits: req.body.lastFourDigits,
        expiryDate: req.body.expiryDate,
      };
    } else if (paymentMethod === 'Bank Transfer') {
      paymentMethodDetails.bankAccountNumber = req.body.bankAccountNumber;
    }

    // Construct the new expense object
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

    // Add the expense to the database
    await addExpense(expense);

    // Update the user's expenses
    user.expenses.push(expense._id);
    await userCollection.updateOne({ _id: user._id }, { $push: { expenses: expense._id } });

    // Redirect to the expenses page after successful addition
    res.redirect('/expenses');
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).send('Error adding expense. Please try again later.');
  }
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


