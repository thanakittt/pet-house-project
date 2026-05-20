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
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="md:text-base text-sm font-bold">
            ยอดขาย
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">
            {periodLabel[period]}
          </CardDescription>
        </div>
        {/* ไอคอนพื้นหลัง */}
        <div className="bg-primary/10 p-2.5 rounded-lg">
          <ShoppingCart className="text-primary" />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        {/* ยอดขายรวม */}
        <div className="text-2xl font-bold">
          {formatCurrency(summary.totalRevenue)}
        </div>

        {/* จำนวนรายการ + % เปลี่ยนแปลง */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{summary.transactionCount} รายการ</span>
          <Badge
            variant={isPositive ? "default" : "destructive"}
            className="text-xs py-0 px-1.5 gap-0.5"
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
