// ===================================================
// get-finance-chart-data.ts — Query ดึงข้อมูล Chart รายรับ-รายจ่าย
// ===================================================
// ใช้ Drizzle SQL query + date-fns
// สร้าง time-series data สำหรับ Bar Chart
// - DAILY: แสดงรายวันของช่วงที่เลือก (1 จุดต่อวัน)
// - MONTHLY: แสดงรายวัน 30 วันล่าสุด
// - YEARLY: แสดงรายเดือน 12 เดือนของปีนี้
// ===================================================

import { db } from "@/db";
import { transactions, transactionCategories } from "@/db/schema";
import { and, eq, gte, lte, isNull, sql } from "drizzle-orm";
import { FinanceChartData, FinanceChartPoint, DashboardPeriod } from "../types/dashboard";
import { getDateRange } from "../utils/date-range";
import {
  format,
  eachDayOfInterval,
  eachMonthOfInterval,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { th } from "date-fns/locale";

// ===================================================
// Helper: ดึงข้อมูล income/expense รวมในช่วงเวลาหนึ่ง
// ===================================================

type PeriodTotals = {
  income: number;
  expense: number;
};

async function getTotalsInRange(
  startDate: Date,
  endDate: Date
): Promise<PeriodTotals> {
  const results = await db
    .select({
      type: transactionCategories.type,
      total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.mapWith(Number),
    })
    .from(transactions)
    .innerJoin(
      transactionCategories,
      eq(transactions.transactionCategoryId, transactionCategories.id)
    )
    .where(
      and(
        isNull(transactions.deletedAt),
        isNull(transactionCategories.deletedAt),
        gte(transactions.transactionDate, startDate),
        lte(transactions.transactionDate, endDate)
      )
    )
    .groupBy(transactionCategories.type);

  let income = 0;
  let expense = 0;
  for (const row of results) {
    if (row.type === "INCOME") income = row.total;
    else if (row.type === "EXPENSE") expense = row.total;
  }
  return { income, expense };
}

/**
 * ดึงข้อมูล time-series สำหรับ Bar Chart
 * - DAILY: รายวัน (1 จุดต่อวัน) ของช่วงที่เลือก
 * - MONTHLY: รายวัน 30 วันล่าสุด
 * - YEARLY: รายเดือน 12 เดือนของปีนี้
 */
export async function getFinanceChartData(
  period: DashboardPeriod
): Promise<FinanceChartData> {
  const { startDate, endDate } = getDateRange(period);

  let points: FinanceChartPoint[] = [];

  if (period === "DAILY") {
    // DAILY: 1 bucket ต่อวัน — ใช้ transactionDate (date-only) เป็น key
    // เนื่องจาก transactionDate ไม่มีเวลา การแบ่งเป็น hour bucket จะทำให้ข้อมูลกองอยู่ใน bucket เดียว
    // จึงเปลี่ยนมาใช้ eachDayOfInterval เหมือน MONTHLY แต่ label แสดงเป็นวัน/เดือน
    const results = await db
      .select({
        type: transactionCategories.type,
        dateString: sql<string>`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM-DD')`,
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.mapWith(Number),
      })
      .from(transactions)
      .innerJoin(
        transactionCategories,
        eq(transactions.transactionCategoryId, transactionCategories.id)
      )
      .where(
        and(
          isNull(transactions.deletedAt),
          isNull(transactionCategories.deletedAt),
          gte(transactions.transactionDate, startDate),
          lte(transactions.transactionDate, endDate)
        )
      )
      .groupBy(transactionCategories.type, transactions.transactionDate);

    // สร้าง map สำหรับทุกวันในช่วง (DAILY = วันเดียว แต่ใช้ pattern เดียวกับ MONTHLY)
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const dayMap = new Map<string, { income: number; expense: number }>();
    for (const day of days) {
      dayMap.set(format(day, "yyyy-MM-dd"), { income: 0, expense: 0 });
    }

    // เติมข้อมูลจริงโดย map transactionDate → วัน
    for (const row of results) {
      const key = row.dateString;
      const existing = dayMap.get(key) ?? { income: 0, expense: 0 };
      if (row.type === "INCOME") existing.income += row.total;
      else if (row.type === "EXPENSE") existing.expense += row.total;
      dayMap.set(key, existing);
    }

    // แปลง map → points โดย label แสดงเป็น "d MMM" (เช่น "28 เม.ย.")
    points = days.map((day) => {
      const key = format(day, "yyyy-MM-dd");
      const bucket = dayMap.get(key) ?? { income: 0, expense: 0 };
      return {
        label: format(day, "d MMM", { locale: th }),
        income: bucket.income,
        expense: bucket.expense,
      };
    });
  } else if (period === "MONTHLY") {
    // รายวัน 30 วันล่าสุด: ดึง aggregate รายวันด้วย SQL GROUP BY date
    const results = await db
      .select({
        type: transactionCategories.type,
        dateString: sql<string>`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM-DD')`,
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.mapWith(Number),
      })
      .from(transactions)
      .innerJoin(
        transactionCategories,
        eq(transactions.transactionCategoryId, transactionCategories.id)
      )
      .where(
        and(
          isNull(transactions.deletedAt),
          isNull(transactionCategories.deletedAt),
          gte(transactions.transactionDate, startDate),
          lte(transactions.transactionDate, endDate)
        )
      )
      .groupBy(transactionCategories.type, transactions.transactionDate);

    // สร้าง map สำหรับทุกวันใน 30 วัน
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const dayMap = new Map<string, { income: number; expense: number }>();
    for (const day of days) {
      dayMap.set(format(day, "yyyy-MM-dd"), { income: 0, expense: 0 });
    }

    // เติมข้อมูลจริง
    for (const row of results) {
      const key = row.dateString;
      const existing = dayMap.get(key) ?? { income: 0, expense: 0 };
      if (row.type === "INCOME") existing.income = row.total;
      else if (row.type === "EXPENSE") existing.expense = row.total;
      dayMap.set(key, existing);
    }

    points = days.map((day) => {
      const key = format(day, "yyyy-MM-dd");
      const bucket = dayMap.get(key) ?? { income: 0, expense: 0 };
      return {
        label: format(day, "d MMM", { locale: th }), // เช่น "1 เม.ย."
        income: bucket.income,
        expense: bucket.expense,
      };
    });
  } else {
    // YEARLY: รายเดือน 12 เดือนของปีนี้
    const results = await db
      .select({
        type: transactionCategories.type,
        dateString: sql<string>`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM')`,
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.mapWith(Number),
      })
      .from(transactions)
      .innerJoin(
        transactionCategories,
        eq(transactions.transactionCategoryId, transactionCategories.id)
      )
      .where(
        and(
          isNull(transactions.deletedAt),
          isNull(transactionCategories.deletedAt),
          gte(transactions.transactionDate, startDate),
          lte(transactions.transactionDate, endDate)
        )
      )
      .groupBy(transactionCategories.type, transactions.transactionDate);

    // สร้าง map 12 เดือน
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    const monthMap = new Map<string, { income: number; expense: number }>();
    for (const month of months) {
      monthMap.set(format(month, "yyyy-MM"), { income: 0, expense: 0 });
    }

    // เติมข้อมูลจริง (aggregate ด้วย JS โดย map date → month)
    for (const row of results) {
      const key = row.dateString;
      const existing = monthMap.get(key) ?? { income: 0, expense: 0 };
      if (row.type === "INCOME") existing.income += row.total;
      else if (row.type === "EXPENSE") existing.expense += row.total;
      monthMap.set(key, existing);
    }

    points = months.map((month) => {
      const key = format(month, "yyyy-MM");
      const bucket = monthMap.get(key) ?? { income: 0, expense: 0 };
      return {
        label: format(month, "MMM", { locale: th }), // เช่น "ม.ค."
        income: bucket.income,
        expense: bucket.expense,
      };
    });
  }

  // คำนวณยอดรวม
  const totalIncome = points.reduce((sum, p) => sum + p.income, 0);
  const totalExpense = points.reduce((sum, p) => sum + p.expense, 0);

  return {
    points,
    totalIncome,
    totalExpense,
    netProfit: totalIncome - totalExpense,
  };
}
