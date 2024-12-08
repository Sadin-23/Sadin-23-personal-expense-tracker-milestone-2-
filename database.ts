import { User, Expense } from './types';
import { MongoClient, Collection, ObjectId } from "mongodb";

const uri = "mongodb+srv://Sadin:Neupane_2003@cluster23.lw1r3ry.mongodb.net/";
const client = new MongoClient(uri);

export const userCollection: Collection<User> = client.db("expenseTracker").collection<User>("users");
export const expenseCollection: Collection<Expense> = client.db("expenseTracker").collection<Expense>("expenses");


export async function getUsers(): Promise<User[]> {
  return await userCollection.find().toArray();
}

export async function getCurrentUser(): Promise<User> {
  let user = await userCollection.findOne({ name: "Sadin Neupane" });

  if (!user) {
    const newUser: User = {
      id: 1,
      _id: new ObjectId(),
      name: "Sadin Neupane",
      email: "sadin.neupane@student.ap.be",
      expenses: [],
      budget: {
        monthlyLimit: 1000,
        notificationThreshold: 0.9,
        isActive: true,
      },
    };
    await userCollection.insertOne(newUser);
    return newUser;
  }
  return user;
}

export async function addExpenseForUser(userId: ObjectId, expense: Expense) {
  
  const result = await expenseCollection.insertOne(expense);

  await userCollection.updateOne(
    { _id: userId },
    { $push: { expenses: result.insertedId } }
  );

  const user = await userCollection.findOne({ _id: userId });
  if (user) {
    const newMonthlyLimit = user.budget.monthlyLimit - expense.amount;

    await userCollection.updateOne(
      { _id: userId },
      { $set: { "budget.monthlyLimit": newMonthlyLimit } }
    );

    if (user.budget.isActive) {
      const remainingBudget = newMonthlyLimit;
      const thresholdAmount = user.budget.monthlyLimit * user.budget.notificationThreshold;

      if (remainingBudget <= thresholdAmount) {
        console.log("Budget warning: The user is about to exceed their budget.");
      }
    }
  }
}



// Haal uitgaven op voor een gebruiker
export async function getExpenses(userId: ObjectId): Promise<Expense[]> {
  const user = await userCollection.findOne({ _id: userId });
  if (!user) throw new Error("User not found.");
  return await expenseCollection
    .find({ _id: { $in: user.expenses } })
    .toArray();
}

export async function getFilteredExpenses(filters: any): Promise<Expense[]> {

  let query: any = {};

  if (filters.category) {
      query.category = filters.category;
  }

  if (filters.isIncoming !== undefined) {
      query.isIncoming = filters.isIncoming === 'true'; 
  }

  if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      query.description = { $regex: searchTerm, $options: 'i' };
  }

  const filteredExpenses = await expenseCollection.find(query).toArray();

  return filteredExpenses;
}


export async function updateExpense(expenseId: ObjectId, updatedExpense: Partial<Expense>): Promise<void> {
  await expenseCollection.updateOne({ _id: expenseId }, { $set: updatedExpense });
}

// uitgave toe te voegen
export async function addExpense(expense: Expense): Promise<void> {
  await expenseCollection.insertOne(expense); 
}

// verwijderen
export async function deleteExpense(expenseId: ObjectId): Promise<void> {
  await expenseCollection.deleteOne({ _id: expenseId });
}


export async function checkBudgetNotification(userId: ObjectId) {
  const user = await userCollection.findOne({ _id: userId });

  if (!user || !user.budget.isActive) return;

  const { monthlyLimit, notificationThreshold } = user.budget;

  const expenses = await expenseCollection.find({ _id: { $in: user.expenses } }).toArray();
  const totalSpent = expenses.reduce((total, expense) => total + expense.amount, 0);

  if (totalSpent >= monthlyLimit * notificationThreshold) {
    // Stuur een notificatie naar de gebruiker
    console.log(`User ${userId} has reached ${Math.round((totalSpent / monthlyLimit) * 100)}% of their budget.`);
  }
}


async function exit() {
  try {
      await client.close();
      console.log("Disconnected from database");
  } catch (error) {
      console.error(error);
  }
  process.exit(0);
}

export async function connect() {
  try {
      await client.connect();
      console.log("Connected to database");
      process.on("SIGINT", exit);
  } catch (error) {
      console.error(error);
  }
}