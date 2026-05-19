// ===================================================
// ReviewSummaryCard.tsx — การ์ดสรุปรีวิวลูกค้า
// ===================================================
// Server Component: แสดงคะแนนเฉลี่ย, star distribution
// และรีวิวล่าสุด 5 รายการ
// ===================================================

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Star } from "lucide-react";
import { ReviewSummary, DashboardPeriod } from "../types/dashboard";
import { formatThaiDate } from "@/lib/utils";

interface ReviewSummaryCardProps {
  summary: ReviewSummary;
  period: DashboardPeriod;
}

// แปลง period เป็นข้อความไทย
const periodLabel: Record<DashboardPeriod, string> = {
  DAILY: "วันนี้",
  MONTHLY: "30 วันล่าสุด",
  YEARLY: "ปีนี้",
};

// Component แสดงดาว (filled/empty)
function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sizeClass = size === "md" ? "size-5" : "size-3";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${star <= rating
            ? "fill-yellow-400 text-yellow-400"
            : "fill-muted text-muted"
            }`}
        />
      ))}
    </div>
  );
}

export function ReviewSummaryCard({ summary, period }: ReviewSummaryCardProps) {
  // หาจำนวนรีวิวสูงสุดสำหรับ distribution bar
  const maxDistribution = Math.max(...Object.values(summary.distribution), 1);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="md:text-lg text-base font-bold">
            รีวิวลูกค้า
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">
            {periodLabel[period]}
          </CardDescription>
        </div>
        <div className="bg-yellow-400/10 p-2.5 rounded-lg">
          <Star className="size-4 text-yellow-400 fill-yellow-400" />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* ส่วนบน: คะแนนเฉลี่ย + star distribution */}
        <div className="flex gap-4">
          {/* คะแนนเฉลี่ย */}
          <div className="flex flex-col items-center justify-center min-w-[80px]">
            <span className="text-3xl font-bold">
              {summary.averageRating.toFixed(1)}
            </span>
            <StarRating rating={Math.round(summary.averageRating)} size="md" />
            <span className="text-xs text-muted-foreground my-2">
              {summary.totalReviews.toLocaleString()} รีวิว
            </span>
          </div>

          {/* Star Distribution bars */}
          <div className="flex-1 flex flex-col gap-1 justify-center">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = summary.distribution[star];
              const percent = (count / maxDistribution) * 100;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-muted-foreground text-right">
                    {star}
                  </span>
                  <Star className="size-3 fill-yellow-400 text-yellow-400 shrink-0" />
                  <div className="flex-1 bg-muted rounded-full h-1.5">
                    <div
                      className="bg-yellow-400 rounded-full h-1.5 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-4 text-muted-foreground text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* กรณีไม่มีรีวิว */}
        {summary.totalReviews === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            ไม่มีรีวิวใน{periodLabel[period]}
          </p>
        )}

        {/* รีวิวล่าสุด */}
        {summary.recentReviews.length > 0 && (
          <div className="flex flex-col gap-2 pt-4 border-t">
            <span className="text-sm font-semibold">
              ล่าสุด
            </span>
            {summary.recentReviews.map((review) => (
              <div key={review.id} className="flex flex-col gap-0.5 pl-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{review.customerName}</span>
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-muted-foreground">
                      {formatThaiDate(review.reviewedAt)}
                    </span>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
