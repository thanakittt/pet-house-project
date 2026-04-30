export type TransactionCategoryForm = {
  name: string;
  type: "EXPENSE" | "INCOME";
};

export type TransactionCategory = {
  id: string;
  name: string;
  type: "EXPENSE" | "INCOME";
};

export const TRANSACTION_TYPE_LABELS: Record<
  TransactionCategory["type"],
  string
> = {
  EXPENSE: "รายจ่าย",
  INCOME: "รายรับ",
};
