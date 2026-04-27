import { db } from "@/db";
import { transactions, transactionCategories } from "@/db/schema";
import { and, eq, gte, lte, isNull, desc } from "drizzle-orm";
import { Transaction, TransactionPeriod } from "../types/transaction";
import { getDateRangeFromPeriod } from "../utils/date-range";
import { isSystemCategory } from "../constants/system-categories";

export async function listTransactions(
  period: TransactionPeriod,
  categoryId?: string,
  date?: string
): Promise<Transaction[]> {
  let dateFilter = undefined;

  if (date) {
    // กรองตามวันที่ระบุตรงๆ
    dateFilter = eq(transactions.transactionDate, new Date(date));
  } else {
    // กรองตาม period
    const { startDate, endDate } = getDateRangeFromPeriod(period);
    if (startDate && endDate) {
      dateFilter = and(
        gte(transactions.transactionDate, startDate),
        lte(transactions.transactionDate, endDate)
      );
    }
  }

  const categoryFilter = categoryId
    ? eq(transactions.transactionCategoryId, categoryId)
    : undefined;

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
      eq(transactions.transactionCategoryId, transactionCategories.id)
    )
    .where(
      and(
        isNull(transactionCategories.deletedAt),
        isNull(transactions.deletedAt),
        dateFilter,
        categoryFilter
      )
    )
    .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt));

  return data.map((item) => ({
    ...item,
    amount: Number(item.amount),
    transactionDate: new Date(item.transactionDate), // แปลงกลับเป็น Date object
    isManual: !isSystemCategory(item.categoryName),
  }));
}
