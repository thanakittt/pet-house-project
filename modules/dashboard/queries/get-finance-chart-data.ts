import { db } from "@/db";
import { transactions, transactionCategories } from "@/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
  format,
  parseISO,
} from "date-fns";
import { th } from "date-fns/locale";
import { formatDateOnly } from "@/lib/finance/date";
import { formatThaiCompactDate } from "@/lib/utils";
import type {
  DashboardChartGranularity,
  DashboardFilter,
  FinanceChartData,
  FinanceChartPoint,
} from "../types/dashboard";

type Bucket = { income: number; expense: number };

function getBucketKey(dateValue: string, granularity: DashboardChartGranularity) {
  if (granularity === "DAY") return dateValue;
  if (granularity === "MONTH") return dateValue.slice(0, 7);
  return dateValue.slice(0, 4);
}

function getBucketLabel(key: string, granularity: DashboardChartGranularity) {
  if (granularity === "DAY") return formatThaiCompactDate(key);
  if (granularity === "MONTH") {
    return format(parseISO(`${key}-01`), "MMM yyyy", { locale: th });
  }
  return `พ.ศ. ${Number(key) + 543}`;
}

function createBucketKeys(filter: DashboardFilter): string[] {
  // ใช้เวลาเที่ยง UTC เพื่อให้ date-fns สร้าง calendar buckets ตรงกัน
  // ทั้งบนเครื่องที่รันด้วย UTC และ Asia/Bangkok
  const interval = {
    start: new Date(`${filter.startDateValue}T12:00:00.000Z`),
    end: new Date(`${filter.endDateValue}T12:00:00.000Z`),
  };
  if (filter.chartGranularity === "DAY") {
    return eachDayOfInterval(interval).map(formatDateOnly);
  }
  if (filter.chartGranularity === "MONTH") {
    return eachMonthOfInterval(interval).map((date) => formatDateOnly(date).slice(0, 7));
  }
  return eachYearOfInterval(interval).map((date) => formatDateOnly(date).slice(0, 4));
}

export async function getFinanceChartData(
  filter: DashboardFilter,
): Promise<FinanceChartData> {
  const results = await db
    .select({
      type: transactionCategories.type,
      dateString: sql<string>`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM-DD')`,
      total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.mapWith(Number),
    })
    .from(transactions)
    .innerJoin(
      transactionCategories,
      eq(transactions.transactionCategoryId, transactionCategories.id),
    )
    .where(
      and(
        isNull(transactions.deletedAt),
        isNull(transactionCategories.deletedAt),
        sql`${transactions.transactionDate} >= ${filter.startDateValue}::date`,
        sql`${transactions.transactionDate} <= ${filter.endDateValue}::date`,
      ),
    )
    .groupBy(transactionCategories.type, transactions.transactionDate);

  const bucketMap = new Map<string, Bucket>(
    createBucketKeys(filter).map((key) => [key, { income: 0, expense: 0 }]),
  );

  for (const row of results) {
    const key = getBucketKey(row.dateString, filter.chartGranularity);
    const bucket = bucketMap.get(key) ?? { income: 0, expense: 0 };
    if (row.type === "INCOME") bucket.income += row.total;
    if (row.type === "EXPENSE") bucket.expense += row.total;
    bucketMap.set(key, bucket);
  }

  const points: FinanceChartPoint[] = [...bucketMap.entries()].map(([key, bucket]) => ({
    label: getBucketLabel(key, filter.chartGranularity),
    ...bucket,
  }));
  const totalIncome = points.reduce((sum, point) => sum + point.income, 0);
  const totalExpense = points.reduce((sum, point) => sum + point.expense, 0);

  return {
    points,
    totalIncome,
    totalExpense,
    netProfit: totalIncome - totalExpense,
  };
}
