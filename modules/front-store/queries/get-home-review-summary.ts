import "server-only";

import { db } from "@/db";
import { appointments, customers, reviews } from "@/db/schema";
import { and, desc, eq, isNull, sql } from "drizzle-orm";

export type HomeRecentReview = {
  id: string;
  rating: number;
  comment: string | null;
  customerName: string;
};

export type HomeReviewSummary = {
  averageRating: number;
  totalReviews: number;
  recentReviews: HomeRecentReview[];
};

export async function getHomeReviewSummary(
  recentReviewLimit = 2,
): Promise<HomeReviewSummary> {
  const validDisplayReviewFilter = and(
    isNull(reviews.deletedAt),
    isNull(appointments.deletedAt),
    isNull(customers.deletedAt),
  );

  // ดึงตัวเลขสรุปและรายการล่าสุดพร้อมกัน เพื่อลดเวลารอของหน้าแรก
  const [statsResult, recentReviewsResult] = await Promise.all([
    db
      .select({
        averageRating:
          sql<number>`COALESCE(AVG(${reviews.rating}), 0)`.mapWith(Number),
        totalReviews: sql<number>`COUNT(${reviews.id})`.mapWith(Number),
      })
      .from(reviews)
      .innerJoin(appointments, eq(reviews.appointmentId, appointments.id))
      .innerJoin(customers, eq(reviews.customerId, customers.id))
      .where(validDisplayReviewFilter),

    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        customerName: customers.nickname,
      })
      .from(reviews)
      .innerJoin(appointments, eq(reviews.appointmentId, appointments.id))
      .innerJoin(customers, eq(reviews.customerId, customers.id))
      .where(validDisplayReviewFilter)
      .orderBy(desc(reviews.createdAt))
      .limit(recentReviewLimit),
  ]);

  const averageRating = statsResult[0]?.averageRating ?? 0;
  const totalReviews = statsResult[0]?.totalReviews ?? 0;

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    recentReviews: recentReviewsResult,
  };
}
