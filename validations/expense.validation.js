import {z} from 'zod'

export const createExpenseSchema = z.object({
    groupId: z.string().min(1, "Group ID is required"),
    paidBy: z.string().min(1, "PaidBy (userId) is required"),
    amount: z.number().positive("Amount must be greater than 0"),
    description: z.string().optional(),
    date: z.string().optional(), 
  splitAmong: z.union([
    z.array(z.string().min(1)),
    z.array(z.object({
      userId: z.string().min(1),
      percentage: z.number().min(1).max(100).optional(),
    }))])
});

export const updateExpenseSchema = z.object({
    amount: z.number().positive().optional(),
    description: z.string().optional(),
    date: z.string().optional(), 
    paidBy: z.string().optional(),
    splitAmong: z.union([
        z.array(z.string().min(1)),
        z.array(z.object({
        userId: z.string().min(1),
        percentage: z.number().min(1).max(100).optional(),
        }))
    ]).optional()
});