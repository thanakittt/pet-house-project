// ===================================================
// SalesOverviewCard.tsx — การ์ดสรุปยอดขาย
// ===================================================
// Server Component: แสดงยอดขายรวม + จำนวนรายการ
// พร้อม badge แสดง % เปลี่ยนแปลงจาก period ก่อน
// ===================================================

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ShoppingCart } from "lucide-react";
import { SalesSummary, DashboardPeriod } from "../types/dashboard";
import { formatCurrency } from "@/lib/utils";

interface SalesOverviewCardProps {
  summary: SalesSummary;
  period: DashboardPeriod;
}

// แปลง period เป็นข้อความไทย
const periodLabel: Record<DashboardPeriod, string> = {
  DAILY: "วันนี้",
  MONTHLY: "30 วันล่าสุด",
  YEARLY: "ปีนี้",
};

export function SalesOverviewCard({ summary, period }: SalesOverviewCardProps) {
  const isPositive = summary.changePercent >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center pb-2">
        <div>
          <CardTitle className="font-bold text-sm md:text-base">
            ยอดขาย
          </CardTitle>
          <CardDescription className="mt-0.5 text-xs">
            {periodLabel[period]}
          </CardDescription>
        </div>
        {/* ไอคอนพื้นหลัง */}
        <div className="flex justify-center items-center bg-emerald-500/10 dark:bg-emerald-500/15 p-2.5 rounded-lg">
          <ShoppingCart
            className="text-emerald-600 dark:text-emerald-300"
            size={20}
          />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        {/* ยอดขายรวม */}
        <div className="font-bold text-2xl">
          {formatCurrency(summary.totalRevenue)}
        </div>

        {/* จำนวนรายการ + % เปลี่ยนแปลง */}
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <span>{summary.transactionCount} รายการ</span>
          <Badge
            variant={isPositive ? "default" : "destructive"}
            className="gap-0.5 px-1.5 py-0 text-xs"
          >
            <TrendIcon className="size-3" />
            {Math.abs(summary.changePercent).toFixed(1)}%
          </Badge>
          <span>จาก period ก่อน</span>
        </div>
      </CardContent>
    </Card>
  );
}
