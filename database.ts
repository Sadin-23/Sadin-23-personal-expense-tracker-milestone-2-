import { User, Expense } from './types';
import { MongoClient, Collection, ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import dotenv from 'dotenv';

const saltRounds : number = 10;

dotenv.config();

export const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const client = new MongoClient(MONGODB_URI);

export const userCollection: Collection<User> = client.db("expenseTracker").collection<User>("users");
export const expenseCollection: Collection<Expense> = client.db("expenseTracker").collection<Expense>("expenses");


export async function getUser(user: User) {
  return await userCollection.findOne({username: user.name});
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const user = await userCollection.findOne({ username });
  if (!user) throw new Error(`User with username ${username} not found.`);
  return user;
}

// Functie om een gebruiker te registreren
export async function createUser(username: string, password: string, email: string): Promise<User> {
  const hashedPassword = await bcrypt.hash(password, 10); // Wachtwoord hashen

  const newUser: User = {
    id: Math.floor(Math.random() * 10000),
    _id: new ObjectId(),
    name: username, 
    username,
    password: hashedPassword,
    role: "USER", 
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


// Functie om wachtwoord te controleren bij login
export async function checkPassword(storedPassword: string, enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, storedPassword);
}









export async function addExpenseForUser(userId: ObjectId, expense: Expense) {
  const session = client.startSession();

  try {
    session.startTransaction();

    // Voeg de uitgave toe aan de uitgaven collectie
    const result = await expenseCollection.insertOne(expense, { session });

    // Voeg de uitgave toe aan de gebruiker
    await userCollection.updateOne(
      { _id: userId },
      { $push: { expenses: result.insertedId } },
      { session }
    );

    // Bereken het nieuwe maandbudget
    const user = await userCollection.findOne({ _id: userId });
    if (user) {
      const newMonthlyLimit = user.budget.monthlyLimit - expense.amount;

      // Update het budget
      await userCollection.updateOne(
        { _id: userId },
        { $set: { "budget.monthlyLimit": newMonthlyLimit } },
        { session }
      );

      // Controleer of notificatie nodig is
      if (user.budget.isActive && newMonthlyLimit <= user.budget.monthlyLimit * user.budget.notificationThreshold) {
        console.log("Budget warning: The user is about to exceed their budget.");
      }
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    console.error('Error adding expense for user:', error);
  } finally {
    session.endSession();
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

async function registerUser() {
  if (await userCollection.countDocuments() > 0) {
      return;
  }
  let email : string | undefined = process.env.ADMIN_EMAIL;
  let password : string | undefined = process.env.ADMIN_PASSWORD;
  if (email === undefined || password === undefined) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment");
  }
  await userCollection.insertOne({
      username: email,
      password: await bcrypt.hash(password, saltRounds),
      role: "ADMIN",
      id: 0,
      _id: new ObjectId,
      name: "",
      expenses: [],
      budget: {
          monthlyLimit: 1000,
          notificationThreshold: 0.9,
          isActive: true,
      },
  });
}

export async function login(email: string, password: string) {
  if (email === "" || password === "") {
      throw new Error("Email and password required");
  }
  let user : User | null = await userCollection.findOne<User>({email: email});
  if (user) {
      if (await bcrypt.compare(password, user.password!)) {
          return user;
      } else {
          throw new Error("Password incorrect");
      }
  } else {
      throw new Error("User not found");
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
      await registerUser();
      console.log("Connected to database");
      process.on("SIGINT", exit);
  } catch (error) {
      console.error(error);
  }
}