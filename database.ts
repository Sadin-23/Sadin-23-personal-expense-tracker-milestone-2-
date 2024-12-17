import { User, Expense } from './types';
import { MongoClient, Collection, ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import dotenv from 'dotenv';

const saltRounds : number = 10;

dotenv.config();

export const MONGODB_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017";
const client = new MongoClient(MONGODB_URI);

export const userCollection: Collection<User> = client.db("expenseTracker").collection<User>("users");
export const expenseCollection: Collection<Expense> = client.db("expenseTracker").collection<Expense>("expenses");


async function exit() {
  try {
      await client.close();
      console.log("Disconnected from database");
  } catch (error) {
      console.error(error);
  }
  process.exit(0);
}

// Gebruikers ophalen
export async function getCurrentUser(): Promise<User> {
  const user = await userCollection.findOne({ _id: ObjectId });
  if (!user) throw new Error('User not found');
  return user;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const user = await userCollection.findOne({ username });
  if (!user) throw new Error(`User with username ${username} not found.`);
  return user;
}

// Functie om wachtwoord te controleren bij login
export async function checkPassword(storedPassword: string, enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, storedPassword);
}




// Uitgaven ophalen
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

  return await expenseCollection.find(query).toArray();
}



export async function updateExpense(expenseId: ObjectId, updatedExpense: Partial<Expense>): Promise<void> {
  await expenseCollection.updateOne({ _id: expenseId }, { $set: updatedExpense });
}

// Uitgave toevoegen
export async function addExpense(expense: Expense): Promise<void> {
  await expenseCollection.insertOne(expense);
}

// verwijderen
export async function deleteExpense(expenseId: ObjectId): Promise<void> {
  await expenseCollection.deleteOne({ _id: expenseId });
}

export async function login(username: string, password: string) {
  if (username === "" || password === "") {
      throw new Error("username and password required");
  }
  let user : User | null = await userCollection.findOne<User>({username: username});
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



export async function connect() {
  try {
      await client.connect();
      console.log("Connected to database");
      process.on("SIGINT", exit);
  } catch (error) {
      console.error(error);
  }
}