// ===================================================
// get-sales-summary.ts — Query ดึงสรุปยอดขายจาก payments
// ===================================================
// ใช้ Drizzle Query API + date-fns
// ดึงข้อมูล payments ที่มีสถานะ PAID แยกตาม period
// พร้อมเปรียบเทียบกับ period ก่อนหน้า
// ===================================================

import { db } from "@/db";
import { payments } from "@/db/schema";
import { and, eq, gte, lte, isNull, sql } from "drizzle-orm";
import type { DashboardFilter, SalesSummary } from "../types/dashboard";
import { getPreviousFilterDateRange } from "../utils/date-range";
import { formatDateOnly } from "@/lib/finance/date";

/**
 * ดึงสรุปยอดขายจากตาราง payments
 * - กรองเฉพาะ status = "PAID"
 * - คำนวณยอดรวม + จำนวนครั้ง
 * - เปรียบเทียบกับ period ก่อนหน้าเพื่อหา % เปลี่ยนแปลง
 */
export async function getSalesSummary(
  filter: DashboardFilter,
): Promise<SalesSummary> {
  const { startDate: prevStart, endDate: prevEnd } = getPreviousFilterDateRange(filter);

  // ดึงยอดขาย period ปัจจุบัน + period ก่อนหน้าพร้อมกัน
  const [currentResult, previousResult] = await Promise.all([
    // period ปัจจุบัน
    db
      .select({
        totalRevenue:
          sql<number>`COALESCE(SUM(${payments.amount}), 0)`.mapWith(Number),
        transactionCount: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, "PAID"),
          isNull(payments.deletedAt),
          gte(payments.paymentDate, filter.startDateValue),
          lte(payments.paymentDate, filter.endDateValue)
        )
      ),

    // period ก่อนหน้า (สำหรับ % เปลี่ยนแปลง)
    db
      .select({
        totalRevenue:
          sql<number>`COALESCE(SUM(${payments.amount}), 0)`.mapWith(Number),
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, "PAID"),
          isNull(payments.deletedAt),
          gte(payments.paymentDate, formatDateOnly(prevStart)),
          lte(payments.paymentDate, formatDateOnly(prevEnd))
        )
      ),
  ]);

  const totalRevenue = currentResult[0]?.totalRevenue ?? 0;
  const transactionCount = currentResult[0]?.transactionCount ?? 0;
  const previousRevenue = previousResult[0]?.totalRevenue ?? 0;

  // คำนวณ % เปลี่ยนแปลง (ป้องกัน division by zero)
  let changePercent = 0;
  if (previousRevenue > 0) {
    changePercent =
      ((totalRevenue - previousRevenue) / previousRevenue) * 100;
  } else if (totalRevenue > 0) {
    // period ก่อนไม่มียอด แต่ period นี้มี → เพิ่ม 100%
    changePercent = 100;
  }

  return {
    totalRevenue,
    transactionCount,
    previousRevenue,
    changePercent: Math.round(changePercent * 100) / 100, // ปัดทศนิยม 2 ตำแหน่ง
  };
}
