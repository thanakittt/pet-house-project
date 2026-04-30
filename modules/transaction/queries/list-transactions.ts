import { db } from "@/db";
import { transactionCategories, transactions } from "@/db/schema";
import { and, count, desc, eq, gte, isNull, lte } from "drizzle-orm";
import { isSystemCategory } from "../constants/system-categories";
import { Transaction, TransactionPeriod } from "../types/transaction";
import { getDateRangeFromPeriod } from "../utils/date-range";

export const TRANSACTION_MANAGEMENT_PAGE_SIZE = 10;

export type ListTransactionsResult = {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function parseTransactionPage(value: unknown): number {
  const parsedValue =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

export async function listTransactions(
  period: TransactionPeriod,
  categoryId?: string,
  date?: string,
  options: { page?: number } = {},
): Promise<ListTransactionsResult> {
  let dateFilter = undefined;

  if (date) {
    dateFilter = eq(transactions.transactionDate, new Date(date));
  } else {
    const { startDate, endDate } = getDateRangeFromPeriod(period);
    if (startDate && endDate) {
      dateFilter = and(
        gte(transactions.transactionDate, startDate),
        lte(transactions.transactionDate, endDate),
      );
    }
  }

  const categoryFilter = categoryId
    ? eq(transactions.transactionCategoryId, categoryId)
    : undefined;

  const where = and(
    isNull(transactionCategories.deletedAt),
    isNull(transactions.deletedAt),
    dateFilter,
    categoryFilter,
  );

  const [{ total }] = await db
    .select({ total: count() })
    .from(transactions)
    .innerJoin(
      transactionCategories,
      eq(transactions.transactionCategoryId, transactionCategories.id),
    )
    .where(where);

  const totalPages = Math.ceil(total / TRANSACTION_MANAGEMENT_PAGE_SIZE);
  const currentPage =
    totalPages > 0
      ? Math.min(Math.max(options.page ?? 1, 1), totalPages)
      : 1;
  const offset = (currentPage - 1) * TRANSACTION_MANAGEMENT_PAGE_SIZE;

  const data = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      transactionDate: transactions.transactionDate,
      note: transactions.note,
      categoryId: transactionCategories.id,
      categoryName: transactionCategories.name,
      categoryType: transactionCategories.type,
    })
    .from(transactions)
    .innerJoin(
      transactionCategories,
      eq(transactions.transactionCategoryId, transactionCategories.id),
    )
    .where(where)
    .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt))
    .limit(TRANSACTION_MANAGEMENT_PAGE_SIZE)
    .offset(offset);

  return {
    transactions: data.map((item) => ({
      ...item,
      amount: Number(item.amount),
      transactionDate: new Date(item.transactionDate),
      isManual: !isSystemCategory(item.categoryName),
    })),
    total,
    page: currentPage,
    pageSize: TRANSACTION_MANAGEMENT_PAGE_SIZE,
    totalPages,
  };
}
