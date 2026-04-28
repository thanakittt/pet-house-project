// ===================================================
// get-appointment-summary.ts — Query ดึงสรุปการจองคิว
// ===================================================
// ใช้ Drizzle Query API + date-fns
// แสดงจำนวนนัดหมายแยกตาม status ใน period ที่เลือก
// ===================================================

import { db } from "@/db";
import { appointments } from "@/db/schema";
import { and, gte, lte, isNull, sql, inArray, notInArray } from "drizzle-orm";
import { AppointmentSummary, DashboardPeriod } from "../types/dashboard";
import { getDateRange } from "../utils/date-range";

/**
 * ดึงสรุปจำนวนการจองคิวแยกตาม status
 * - active: PENDING_DEPOSIT, PENDING_APPROVAL, CONFIRMED, CHECKED_IN, IN_PROGRESS, READY_FOR_PICKUP
 * - completed: COMPLETED
 * - cancelled: CANCELLED, NO_SHOW
 */
export async function getAppointmentSummary(
  period: DashboardPeriod,
): Promise<AppointmentSummary> {
  const { startDate, endDate } = getDateRange(period);

  // ดึงจำนวนนัดหมายแยกตาม status ใน 1 query
  const results = await db
    .select({
      status: appointments.status,
      count: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(appointments)
    .where(
      and(
        isNull(appointments.deletedAt),
        gte(appointments.appointmentDate, startDate),
        lte(appointments.appointmentDate, endDate),
      ),
    )
    .groupBy(appointments.status);

  // รวมผลลัพธ์ตาม group
  const statusMap = new Map(results.map((r) => [r.status, r.count]));

  // status ที่ถือว่า "กำลังดำเนินการ / รอดำเนินการ"
  const activeStatuses = [
    "PENDING_DEPOSIT",
    "PENDING_APPROVAL",
    "CONFIRMED",
    "CHECKED_IN",
    "IN_PROGRESS",
    "READY_FOR_PICKUP",
  ] as const;

  const active = activeStatuses.reduce(
    (sum, s) => sum + (statusMap.get(s) ?? 0),
    0,
  );
  const completed = statusMap.get("COMPLETED") ?? 0;
  const cancelled =
    (statusMap.get("CANCELLED") ?? 0) + (statusMap.get("NO_SHOW") ?? 0);

  return {
    total: active + completed + cancelled,
    active,
    completed,
    cancelled,
  };
}
