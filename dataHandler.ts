import { User, Expense } from './interfaces/interface';

const users: User[] = [];

export const loadUsers = (): User[] => {
  return users;
};


export const getCurrentUser = (): User => {
  let user = users.find(u => u.name === 'Sadin Neupane');

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
  }

  return user;
};

export const addExpenseForUser = (user: User, expense: Expense) => {
  expense.id = user.expenses.length + 1;
  user.expenses.push(expense);

  const userIndex = users.findIndex(u => u.id === user.id);
  if (userIndex !== -1) {
    users[userIndex] = user;
  }
};
