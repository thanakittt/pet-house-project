// ===================================================
// get-popular-services.ts — Query ดึงบริการยอดนิยม
// ===================================================
// ใช้ Drizzle SQL query (JOIN หลายตาราง) + date-fns
// นับจำนวน appointment_items แยกตาม service
// และรวมรายได้โดยอิงจาก price ของแต่ละ item
// ===================================================

import { db } from "@/db";
import {
  appointmentItems,
  serviceVariants,
  services,
  appointments,
} from "@/db/schema";
import { and, eq, gte, lte, isNull, sql, desc, notInArray } from "drizzle-orm";
import type { DashboardFilter, PopularService } from "../types/dashboard";

/**
 * ดึง TOP 5 บริการยอดนิยมตาม period ที่เลือก
 * - นับจาก appointment_items ที่อยู่ใน appointments ของ period นั้น
 * - GROUP BY services.name
 * - เรียงจากมากไปน้อย (count DESC)
 */
export async function getPopularServices(
  filter: DashboardFilter,
  limit: number = 5,
): Promise<PopularService[]> {
  // JOIN: appointment_items → appointments (สำหรับ filter วันที่)
  //       appointment_items → service_variants → services (สำหรับชื่อบริการ)
  const results = await db
    .select({
      serviceName: services.name,
      count: sql<number>`COUNT(${appointmentItems.id})`.mapWith(Number),
      revenue: sql<number>`COALESCE(SUM(${appointmentItems.price}), 0)`.mapWith(
        Number,
      ),
    })
    .from(appointmentItems)
    .innerJoin(
      appointments,
      eq(appointmentItems.appointmentId, appointments.id),
    )
    .innerJoin(
      serviceVariants,
      eq(appointmentItems.serviceVariantId, serviceVariants.id),
    )
    .innerJoin(services, eq(serviceVariants.serviceId, services.id))
    .where(
      and(
        isNull(appointmentItems.deletedAt),
        isNull(appointments.deletedAt),
        isNull(serviceVariants.deletedAt),
        isNull(services.deletedAt),
        notInArray(appointments.status, ["CANCELLED", "NO_SHOW"]),
        gte(appointments.appointmentDate, filter.startDateValue),
        lte(appointments.appointmentDate, filter.endDateValue),
      ),
    )
    .groupBy(services.id, services.name)
    .orderBy(desc(sql`COUNT(${appointmentItems.id})`))
    .limit(limit);

  return results.map((row) => ({
    serviceName: row.serviceName,
    count: row.count,
    revenue: row.revenue,
  }));
}
