import { Request, Response, NextFunction } from 'express';

export function validateExpenseInput(req: Request, res: Response, next: NextFunction) {
  const { description, amount, currency, paymentMethod } = req.body;

  if (!description || !amount || !currency || !paymentMethod) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  next(); 
}
