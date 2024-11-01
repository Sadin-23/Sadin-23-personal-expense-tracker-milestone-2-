import * as readlineSync from 'readline-sync';
import * as fs from 'fs';
import * as path from 'path';
import { User, Expense, PaymentMethod } from './interfaces/interface';

const dataFilePath = path.join(__dirname, 'db.json');

const loadUsers = (): User[] => {
  if (!fs.existsSync(dataFilePath)) {
    return [];
  }
  const data = fs.readFileSync(dataFilePath, 'utf8');
  return JSON.parse(data) as User[];
};

const saveUsers = (users: User[]) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(users, null, 2));
};

const getCurrentUser = (): User => {
  const users = loadUsers();
  let user = users.find(u => u.name === 'John Doe');
  if (!user) {
    user = {
      id: 1,
      name: 'Sadin Neupane',
      email: 'sadin.neupane@student.ap.be',
      expenses: [],
      budget: {
        monthlyLimit: 1000,
        notificationThreshold: 0.9,
        isActive: true
      }
    };
    users.push(user);
    saveUsers(users);
  }
  return user;
};

const user = getCurrentUser();

const addExpense = () => {
  const description = readlineSync.question('Enter description: ');
  const amount = readlineSync.questionFloat('Enter amount: ');
  const currency = readlineSync.question('Enter currency (e.g., USD, EUR): ');
  const paymentMethodType = readlineSync.question('Enter payment method (Credit Card/Bank Transfer): ');

  let paymentMethod: PaymentMethod = { method: paymentMethodType };
  if (paymentMethodType === 'Credit Card') {
    const lastFourDigits = readlineSync.question('Enter last 4 digits of credit card: ');
    const expiryDate = readlineSync.question('Enter expiry date (MM/YY): ');
    paymentMethod.cardDetails = { lastFourDigits, expiryDate };
  } else if (paymentMethodType === 'Bank Transfer') {
    const bankAccountNumber = readlineSync.question('Enter bank account number: ');
    paymentMethod.bankAccountNumber = bankAccountNumber;
  }

  const isIncoming = readlineSync.question('Is this income? (yes/no): ') === 'yes';
  const category = readlineSync.question('Enter category: ');
  const tags = readlineSync.question('Enter tags (comma separated): ').split(',').map(tag => tag.trim());
  const isPaid = readlineSync.question('Is this expense paid? (yes/no): ') === 'yes';

  const expense: Expense = {
    id: user.expenses.length + 1,
    description,
    amount,
    currency,
    date: new Date().toISOString(),
    paymentMethod,
    isIncoming,
    category,
    tags,
    isPaid
  };

  user.expenses.push(expense);
  saveUsers(loadUsers().map(u => (u.id === user.id ? user : u)));
  console.log('Expense added successfully!');
};

const browseExpenses = () => {
  console.log(`Expenses for ${user.name}:`);
  user.expenses.forEach((expense) => {
    console.log(`${expense.id}. ${expense.description} - ${expense.amount} ${expense.currency}`);
    console.log(`Date: ${expense.date}`);
    console.log(`Paid: ${expense.isPaid ? 'Yes' : 'No'}`);
    console.log(`Category: ${expense.category}`);
    console.log(`Tags: ${expense.tags.join(', ')}`);
  });
};

while (true) {
  const action = readlineSync.question('Choose an action: [add] expense, [browse] expenses, [exit]: ');

  if (action === 'add') {
    addExpense();
  } else if (action === 'browse') {
    browseExpenses();
  } else if (action === 'exit') {
    break;
  }
}
