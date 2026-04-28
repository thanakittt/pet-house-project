// ===================================================
// get-finance-chart-data.ts — Query ดึงข้อมูล Chart รายรับ-รายจ่าย
// ===================================================
// ใช้ Drizzle SQL query + date-fns
// สร้าง time-series data สำหรับ Bar Chart
// - DAILY: แสดงรายชั่วโมง (00:00 - 23:00) ของวันนี้
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
  eachHourOfInterval,
  eachDayOfInterval,
  eachMonthOfInterval,
  startOfHour,
  endOfHour,
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
 * - DAILY: ทุก 2 ชั่วโมง (12 จุด) ของวันนี้
 * - MONTHLY: รายวัน 30 วันล่าสุด
 * - YEARLY: รายเดือน 12 เดือนของปีนี้
 */
export async function getFinanceChartData(
  period: DashboardPeriod
): Promise<FinanceChartData> {
  const { startDate, endDate } = getDateRange(period);

  let points: FinanceChartPoint[] = [];

  if (period === "DAILY") {
    // แบ่งเป็นช่วงละ 2 ชั่วโมง (00:00, 02:00, ..., 22:00) = 12 จุด
    const hours = eachHourOfInterval({ start: startDate, end: endDate }).filter(
      (_, i) => i % 2 === 0 // เอาแค่ทุก 2 ชั่วโมง
    );

    // ดึง transactions ทั้งวันครั้งเดียว แล้ว bucket ด้วย JS
    const rawData = await db
      .select({
        type: transactionCategories.type,
        amount: transactions.amount,
        transactionDate: transactions.transactionDate,
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
      );

    // สำหรับ DAILY ใช้ hour เป็น bucket (เนื่องจาก transactionDate เป็น date ไม่มีเวลา)
    // จะสร้าง 12 bucket แต่ข้อมูลจะรวมอยู่ใน bucket แรก (เนื่องจาก date only)
    // ดังนั้นวันนี้จะแสดงใน 00:00 bucket
    const buckets = new Map<
      string,
      { income: number; expense: number }
    >();
    for (const h of hours) {
      buckets.set(format(h, "HH:00"), { income: 0, expense: 0 });
    }

    // เติมข้อมูลจริง (ทุก transaction ของวันนี้รวมอยู่ใน "00:00" bucket)
    for (const row of rawData) {
      const key = "00:00"; // date-only field → ไม่มีเวลา ใส่ใน bucket แรก
      const bucket = buckets.get(key) ?? { income: 0, expense: 0 };
      const amount = Number(row.amount);
      if (row.type === "INCOME") bucket.income += amount;
      else if (row.type === "EXPENSE") bucket.expense += amount;
      buckets.set(key, bucket);
    }

    points = hours.map((h) => {
      const key = format(h, "HH:00");
      const bucket = buckets.get(key) ?? { income: 0, expense: 0 };
      return { label: key, income: bucket.income, expense: bucket.expense };
    });
  } else if (period === "MONTHLY") {
    // รายวัน 30 วันล่าสุด: ดึง aggregate รายวันด้วย SQL GROUP BY date
    const results = await db
      .select({
        type: transactionCategories.type,
        date: transactions.transactionDate,
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
      const key = format(new Date(row.date), "yyyy-MM-dd");
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
        date: transactions.transactionDate,
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
      const key = format(new Date(row.date), "yyyy-MM");
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
