import express, { Request, Response } from 'express';
import path from 'path';
import { addExpenseForUser, getCurrentUser } from './dataHandler'; 
import { User, Expense } from './interfaces/interface';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

const currentUser: User = getCurrentUser();

app.get('/', (req: Request, res: Response) => {
  res.render('index', { user: currentUser });
});

app.get('/add-expense', (req: Request, res: Response) => {
  res.render('add-expense');
});

app.get('/expenses', (req: Request, res: Response) => {
  res.render('expenses', { user: currentUser });
});

app.post('/add-expense', (req: Request, res: Response) => {
  const { description, amount, currency, paymentMethod, isIncoming, category, tags, isPaid } = req.body;

  const newExpense: Expense = {
    id: currentUser.expenses.length + 1,
    description,
    amount: parseFloat(amount),
    currency,
    date: new Date().toISOString(),
    paymentMethod: { method: paymentMethod },
    isIncoming: isIncoming === 'yes',
    category,
    tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
    isPaid: isPaid === 'yes'
  };

  addExpenseForUser(currentUser, newExpense);  

  res.redirect('/');
});

export default app;
