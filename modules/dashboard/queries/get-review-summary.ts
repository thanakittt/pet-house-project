// ===================================================
// get-review-summary.ts — Query ดึงสรุปรีวิวลูกค้า
// ===================================================
// ใช้ Drizzle Query API (db.query) + date-fns
// แสดงคะแนนเฉลี่ย, จำนวนรีวิว, distribution และรีวิวล่าสุด
// ===================================================

import { db } from "@/db";
import { reviews, customers, appointments } from "@/db/schema";
import { and, eq, gte, lte, isNull, sql, desc, avg, count } from "drizzle-orm";
import { ReviewSummary, RecentReview, DashboardPeriod } from "../types/dashboard";
import { getDateRange } from "../utils/date-range";

/**
 * ดึงสรุปรีวิวของลูกค้าตาม period ที่เลือก
 * - คำนวณคะแนนเฉลี่ย
 * - นับจำนวนรีวิวทั้งหมด
 * - หาการกระจายตัวของคะแนน (1-5 stars)
 * - ดึงรีวิวล่าสุด 5 รายการพร้อมชื่อลูกค้า
 */
export async function getReviewSummary(
  period: DashboardPeriod
): Promise<ReviewSummary> {
  const { startDate, endDate } = getDateRange(period);

  // กรองตาม reviews.createdAt เพื่อให้ period ตรงกับวันที่เขียนรีวิวจริง
  // (ไม่ใช่ appointmentDate ซึ่งเป็นวันนัดหมาย อาจอยู่คนละช่วงเวลากัน)
  const dateFilter = and(
    isNull(reviews.deletedAt),
    isNull(appointments.deletedAt),
    gte(reviews.createdAt, startDate),
    lte(reviews.createdAt, endDate)
  );

  // ดึง aggregate stats + distribution พร้อมกัน
  const [statsResult, distributionResult, recentReviewsResult] =
    await Promise.all([
      // คะแนนเฉลี่ย + จำนวนรีวิว
      db
        .select({
          averageRating:
            sql<number>`COALESCE(AVG(${reviews.rating}), 0)`.mapWith(Number),
          totalReviews: sql<number>`COUNT(${reviews.id})`.mapWith(Number),
        })
        .from(reviews)
        .innerJoin(appointments, eq(reviews.appointmentId, appointments.id))
        .where(dateFilter),

      // การกระจายตัวของคะแนน (1-5 stars)
      db
        .select({
          rating: reviews.rating,
          count: sql<number>`COUNT(*)`.mapWith(Number),
        })
        .from(reviews)
        .innerJoin(appointments, eq(reviews.appointmentId, appointments.id))
        .where(dateFilter)
        .groupBy(reviews.rating),

      // รีวิวล่าสุด 5 รายการพร้อมชื่อเล่นลูกค้า (customers.nickname)
      db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          comment: reviews.comment,
          customerName: customers.nickname, // ใช้ nickname เนื่องจาก customers ไม่มีฟิลด์ name
          reviewCreatedAt: reviews.createdAt, // วันที่เขียนรีวิวจริง (ไม่ใช่ appointmentDate)
        })
        .from(reviews)
        .innerJoin(appointments, eq(reviews.appointmentId, appointments.id))
        .innerJoin(customers, eq(reviews.customerId, customers.id))
        .where(dateFilter)
        .orderBy(desc(reviews.createdAt))
        .limit(5),
    ]);

  // สร้าง distribution map (default = 0 ทุกดาว)
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  for (const row of distributionResult) {
    const star = row.rating as 1 | 2 | 3 | 4 | 5;
    if (star >= 1 && star <= 5) {
      distribution[star] = row.count;
    }
  }

  // แปลง recentReviews โดยใช้ reviewCreatedAt (วันที่เขียนรีวิวจริง) เป็น reviewedAt
  const recentReviews: RecentReview[] = recentReviewsResult.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    customerName: r.customerName,
    reviewedAt: new Date(r.reviewCreatedAt), // มาจาก reviews.createdAt ไม่ใช่ appointmentDate
  }));

  const averageRating = statsResult[0]?.averageRating ?? 0;
  const totalReviews = statsResult[0]?.totalReviews ?? 0;

  return {
    averageRating: Math.round(averageRating * 10) / 10, // ปัดทศนิยม 1 ตำแหน่ง
    totalReviews,
    distribution,
    recentReviews,
  };
}
