import type { Metadata } from "next";
import { Suspense } from "react";
import { requireOwner } from "@/lib/session";
import { SiteHeader } from "@/components/site-header";
import { Skeleton } from "@/components/ui/skeleton";

// queries
import { getSalesSummary } from "@/modules/dashboard/queries/get-sales-summary";
import { getAppointmentSummary } from "@/modules/dashboard/queries/get-appointment-summary";
import { getPopularServices } from "@/modules/dashboard/queries/get-popular-services";
import { getReviewSummary } from "@/modules/dashboard/queries/get-review-summary";
import { getFinanceChartData } from "@/modules/dashboard/queries/get-finance-chart-data";

// components
import { DashboardPeriodFilter } from "@/modules/dashboard/components/DashboardPeriodFilter";
import { SalesOverviewCard } from "@/modules/dashboard/components/SalesOverviewCard";
import { AppointmentSummaryCard } from "@/modules/dashboard/components/AppointmentSummaryCard";
import { PopularServicesCard } from "@/modules/dashboard/components/PopularServicesCard";
import { ReviewSummaryCard } from "@/modules/dashboard/components/ReviewSummaryCard";
import { FinanceOverviewChart } from "@/modules/dashboard/components/FinanceOverviewChart";

import { DashboardPeriod } from "@/modules/dashboard/types/dashboard";

export const metadata: Metadata = {
  title: "ภาพรวมธุรกิจ",
  description: "ภาพรวมธุรกิจ — ยอดขาย การจองคิว บริการยอดนิยม รีวิว และการเงิน",
};

// ===================================================
// DashboardPage — Server Component
// ===================================================
// ดึงข้อมูลทั้ง 5 sections แบบ parallel ผ่าน Promise.all
// เพื่อลด latency โดยรวม
// ===================================================

export default async function DashboardPage(props: {
  searchParams: Promise<{ period?: string }>;
}) {
  // ตรวจสอบสิทธิ์: เฉพาะ owner เท่านั้น
  await requireOwner();

  const searchParams = await props.searchParams;

  // กำหนด period จาก URL หรือ default = MONTHLY
  const allowedPeriods: DashboardPeriod[] = ["DAILY", "MONTHLY", "YEARLY"];
  const period: DashboardPeriod = allowedPeriods.includes(
    searchParams.period as DashboardPeriod,
  )
    ? (searchParams.period as DashboardPeriod)
    : "MONTHLY";

  // ดึงข้อมูลทั้ง 5 sections พร้อมกัน
  const [sales, appointments, popularServices, reviews, financeChart] =
    await Promise.all([
      getSalesSummary(period),
      getAppointmentSummary(period),
      getPopularServices(period, 5),
      getReviewSummary(period),
      getFinanceChartData(period),
    ]);

  return (
    <>
      <SiteHeader title="ภาพรวมธุรกิจ" />

      <div className="flex flex-col gap-6 w-full py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ===== Header: ชื่อหน้า + Period Filter ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
          {/* ต้องครอบด้วย Suspense เนื่องจาก useSearchParams */}
          <Suspense fallback={<Skeleton className="h-9 w-[240px]" />}>
            <DashboardPeriodFilter currentPeriod={period} />
          </Suspense>
        </div>

        {/* ===== Row 1: ยอดขาย + การจองคิว (2 cols) ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SalesOverviewCard summary={sales} period={period} />
          <AppointmentSummaryCard summary={appointments} period={period} />
        </div>

        {/* ===== Row 2: Finance Chart (เต็มความกว้าง) ===== */}
        <FinanceOverviewChart data={financeChart} period={period} />

        {/* ===== Row 3: บริการยอดนิยม + รีวิวลูกค้า (2 cols) ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PopularServicesCard services={popularServices} period={period} />
          <ReviewSummaryCard summary={reviews} period={period} />
        </div>
      </div>
    </>
  );
}
