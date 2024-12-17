import express from 'express';
import bcrypt from 'bcrypt';
import { userCollection } from '../database';
import { User } from '../types';
import { ObjectId } from 'mongodb';

const saltRounds = 10;

export function registrationRouter() {
  const router = express.Router();

  // Toon het registratieformulier
  router.get('/register', (req, res) => {
    res.render('register', { message: req.session.message });
    req.session.message = null; // Reset de flash message
  });

  // Verwerk registratieformulier
  router.post('/register', async (req, res) => {
    const { name, username, password } = req.body;

    // Controleer of alle velden ingevuld zijn
    if (!name || !password) {
      req.session.message = { type: 'error', message: 'All fields are required' };
      return res.redirect('/register');
    }

    // Controleer of de gebruikersnaam al bestaat
    const existingUser = await userCollection.findOne({ username });
    if (existingUser) {
      req.session.message = { type: 'error', message: 'Username already exists' };
      return res.redirect('/register');
    }

    // Wachtwoord hashen
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Maak een nieuwe gebruiker aan
    const newUser: User = {
      _id: new ObjectId(),
      id: 0, // Gebruik een echte ID als dat nodig is
      name,
      username,
      password: hashedPassword,
      role: 'USER', // Standaardrol: USER
      expenses: [],
      budget: { monthlyLimit: 1000, notificationThreshold: 0.9, isActive: true },
    };

    // Sla de gebruiker op in de database
    await userCollection.insertOne(newUser);

    req.session.message = { type: 'success', message: 'Registration successful, please log in' };
    res.redirect('/login');
  });

  return router;
}
