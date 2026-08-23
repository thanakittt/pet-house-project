import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireOwner } from "@/lib/session";
import { SiteHeader } from "@/components/site-header";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";
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

import {
  getCanonicalCustomUrl,
  resolveDashboardFilter,
  type DashboardSearchParams,
} from "@/modules/dashboard/utils/date-range";

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
  searchParams: Promise<DashboardSearchParams>;
}) {
  // ตรวจสอบสิทธิ์: เฉพาะ owner เท่านั้น
  await requireOwner();

  const searchParams = await props.searchParams;

  const { filter, needsCanonicalRedirect } = resolveDashboardFilter(searchParams);
  if (needsCanonicalRedirect) redirect(getCanonicalCustomUrl(filter));

  // ดึงข้อมูลทั้ง 5 sections พร้อมกัน
  const [sales, appointments, popularServices, reviews, financeChart] =
    await Promise.all([
      getSalesSummary(filter),
      getAppointmentSummary(filter),
      getPopularServices(filter, 5),
      getReviewSummary(filter),
      getFinanceChartData(filter),
    ]);

  return (
    <>
      <SiteHeader title="ภาพรวมธุรกิจ" />

      <BackOfficeContainer>
        <div className="flex flex-col gap-4">
          {/* ===== Header: ชื่อหน้า + Period Filter ===== */}
          <div className="flex sm:flex-row flex-col sm:justify-end sm:items-center gap-4">
            {/* ต้องครอบด้วย Suspense เนื่องจาก useSearchParams */}
            <Suspense fallback={<Skeleton className="w-[240px] h-9" />}>
              <DashboardPeriodFilter filter={filter} />
            </Suspense>
          </div>
          {/* ===== Row 1: ยอดขาย + การจองคิว (2 cols) ===== */}
          <div className="gap-4 grid grid-cols-1 sm:grid-cols-2">
            <SalesOverviewCard summary={sales} periodLabel={filter.label} />
            <AppointmentSummaryCard summary={appointments} periodLabel={filter.label} />
          </div>
          {/* ===== Row 2: Finance Chart (เต็มความกว้าง) ===== */}
          <FinanceOverviewChart data={financeChart} periodLabel={filter.label} />
          {/* ===== Row 3: บริการยอดนิยม + รีวิวลูกค้า (2 cols) ===== */}
          <div className="gap-4 grid grid-cols-1 lg:grid-cols-2">
            <PopularServicesCard services={popularServices} periodLabel={filter.label} />
            <ReviewSummaryCard summary={reviews} periodLabel={filter.label} />
          </div>
        </div>
      </BackOfficeContainer>
    </>
  );
}
