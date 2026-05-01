import { db } from "@/db";
import { transactions, transactionCategories } from "@/db/schema";
import { and, eq, gte, lte, isNull, sql } from "drizzle-orm";
import { TransactionPeriod, TransactionSummary } from "../types/transaction";
import { getDateRangeFromPeriod } from "../utils/date-range";
import { formatDateOnly } from "@/lib/finance/date";

export async function getTransactionSummary(
  period: TransactionPeriod,
  categoryId?: string,
  date?: string
): Promise<TransactionSummary> {
  let dateFilter = undefined;

  if (date) {
    // กรองตามวันที่ระบุตรงๆ
    dateFilter = eq(transactions.transactionDate, formatDateOnly(new Date(date)));
  } else {
    // กรองตาม period
    const { startDate, endDate } = getDateRangeFromPeriod(period);
    if (startDate && endDate) {
      dateFilter = and(
        gte(transactions.transactionDate, formatDateOnly(startDate)),
        lte(transactions.transactionDate, formatDateOnly(endDate))
      );
    }
  }

  const categoryFilter = categoryId
    ? eq(transactions.transactionCategoryId, categoryId)
    : undefined;

  // ดึงยอดรวมแยกตามประเภท (INCOME, EXPENSE)
  const results = await db
    .select({
      type: transactionCategories.type,
      total: sql<number>`sum(${transactions.amount})`.mapWith(Number),
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
    .groupBy(transactionCategories.type);

  let totalIncome = 0;
  let totalExpense = 0;

  for (const row of results) {
    if (row.type === "INCOME") {
      totalIncome = row.total;
    } else if (row.type === "EXPENSE") {
      totalExpense = row.total;
    }
  }

  const netProfit = totalIncome - totalExpense;

  return {
    totalIncome,
    totalExpense,
    netProfit,
  };
}
