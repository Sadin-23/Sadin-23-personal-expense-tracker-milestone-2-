import express from 'express';
import { addExpense, getFilteredExpenses, updateExpense, deleteExpense, getCurrentUser, userCollection } from '../database';
import { Expense, PaymentMethod, User } from '../types';
import { ObjectId } from 'mongodb';
import bcrypt from "bcrypt";
import { secureMiddleware } from '../Middleware/secureMiddleware';

let saltRounds: number = 10;

export function createRouter() {
  const router = express.Router();

   // Toon het registratieformulier
   router.get("/register", (req, res) => {
    res.render("register");
});

// Verwerk registratieformulier
router.post("/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        req.session.message = { type: "error", message: "Username and password are required" };
        return res.redirect("/register");
    }

    // Controleer of de gebruikersnaam al bestaat
    const existingUser = await userCollection.findOne({ username });
    if (existingUser) {
        req.session.message = { type: "error", message: "Username already exists" };
        return res.redirect("/register");
    }

    // Wachtwoord hashen
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Sla de nieuwe gebruiker op
    const newUser: User = {
      _id: new ObjectId(),
      username,
      password: hashedPassword,
      role: "USER", // Stel de rol in als USER
      expenses: [],
      budget: { monthlyLimit: 1000, notificationThreshold: 0.9, isActive: true },
      id: 0,
      name: ''
    };

    await userCollection.insertOne(newUser);

    req.session.message = { type: "success", message: "Registration successful" };
    res.redirect("/login");
});

router.get('/index', secureMiddleware, async (req, res) => {
  const user = req.session.user;  // Haal de gebruiker uit de sessie

  if (!user) {
      // Als de gebruiker niet is ingelogd, redirect naar login
      req.session.message = { type: "error", message: "You need to log in first" };
      return res.redirect("/login");
  }

  // Render de homepagina of dashboard view
  res.render('index', { user });
});

  

  router.get('/add-expense', async (req, res) => {
    const user = await getCurrentUser();
    
    res.render('add-expense', {user});
  });

  router.get("/expenses", secureMiddleware, async (req, res) => {
    const user = req.session.user;
    console.log("User sessie:", user);

    if (!user) {
        req.session.message = { type: "error", message: "You must be logged in to view expenses" };
        return res.redirect("/login");
    }
    const expenses = await getFilteredExpenses({ userId: user._id });
    
    res.render("expenses", { expenses, user });
});




  router.post('/add-expense', async (req, res) => {
    const { description, amount, currency, paymentMethod, category, tags, isIncoming, isPaid } = req.body;

    const user = await getCurrentUser();
    console.log("Huidige gebruiker:", user);

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

    try {
      await addExpense(expense);
      user.expenses.push(expense._id);  // Voeg expense-id toe aan de gebruiker
      res.redirect('/expenses');  // Redirect na het toevoegen van een expense
  } catch (error) {
      console.error("Fout bij het toevoegen van expense:", error);
      req.session.message = { type: "error", message: "Er is iets mis gegaan bij het toevoegen van de uitgave" };
      res.redirect("/add-expense");  // Redirect naar de add-expense pagina
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


