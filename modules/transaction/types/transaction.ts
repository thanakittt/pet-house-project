import { z } from "zod";

// ประเภทของ Date Filter
export type TransactionPeriod = "DAILY" | "MONTHLY" | "YEARLY" | "ALL";

// ประเภทข้อมูลที่ใช้แสดงผล
export type Transaction = {
  id: string;
  amount: number;
  transactionDate: Date;
  note: string | null;
  categoryId: string;
  categoryName: string;
  categoryType: "INCOME" | "EXPENSE";
  isManual: boolean; // เป็น true ถ้าไม่ได้ผูกกับ appointmentId หรือ purchaseOrderId
};

export type TransactionSummary = {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
};

// Form schema สำหรับสร้าง/แก้ไข
export const transactionSchema = z.object({
  amount: z.number().positive("จำนวนเงินต้องมากกว่า 0"),
  transactionDate: z.date(),
  note: z.string().optional(),
  transactionCategoryId: z.string().min(1, "กรุณาเลือกหมวดหมู่"),
});

export type TransactionForm = z.infer<typeof transactionSchema>;
