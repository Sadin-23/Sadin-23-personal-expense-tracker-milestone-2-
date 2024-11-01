export interface PaymentMethod {
    method: string;
    cardDetails?: {
      lastFourDigits: string; 
      expiryDate: string;
    };
    bankAccountNumber?: string;
  }
  
  export interface Expense {
    id: number;
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
  
  export interface Budget {
    monthlyLimit: number;
    notificationThreshold: number;
    isActive: boolean;
  }
  
  export interface User {
    id: number;
    name: string;
    email: string;
    expenses: Expense[];
    budget: Budget;
  }
  