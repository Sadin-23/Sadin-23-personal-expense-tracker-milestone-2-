import { ObjectId } from "mongodb";

export interface User {
    id: number;
    _id: ObjectId;
    name: string;
    email: string;
    expenses: ObjectId[];
    budget: Budget;
  }

  
  export interface Expense {
    _id: ObjectId;
    description: string;
    amount: number;
    date: string;
    currency: string;
    paymentMethod: PaymentMethod;
    isIncoming: boolean;
    category: string;
    tags: string[];
    isPaid: boolean;
  }

  export interface PaymentMethod {
    method: string;
    cardDetails?: {
      lastFourDigits: string; 
      expiryDate: string;
    };
    bankAccountNumber?: string;
  }
  
  export interface Budget {
    monthlyLimit: number;
    notificationThreshold: number;
    isActive: boolean;
  }
  
  
  