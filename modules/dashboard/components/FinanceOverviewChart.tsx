"use client";
// ===================================================
// FinanceOverviewChart.tsx — Bar Chart รายรับ-รายจ่าย
// ===================================================
// Client Component: ใช้ shadcn Chart (Recharts v3)
// แสดง income vs expense แบบ side-by-side bar
// พร้อม summary cards ด้านบน (รายรับ / รายจ่าย / กำไร)
// ===================================================

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { TrendingUp, TrendingDown } from "lucide-react";
import { FinanceChartData, DashboardPeriod } from "../types/dashboard";
import { formatCurrency } from "@/lib/utils";

interface FinanceOverviewChartProps {
  data: FinanceChartData;
  period: DashboardPeriod;
}

// แปลง period เป็นข้อความไทย
const periodLabel: Record<DashboardPeriod, string> = {
  DAILY: "วันนี้",
  MONTHLY: "30 วันล่าสุด",
  YEARLY: "ปีนี้",
};

// config สำหรับ chart (สี + label)
const chartConfig = {
  income: {
    label: "รายรับ",
    color: "var(--chart-2)", // เขียว (จาก globals.css)
  },
  expense: {
    label: "รายจ่าย",
    color: "var(--chart-1)", // ส้ม/แดง
  },
} satisfies ChartConfig;

const chartHeightClass =
  "h-[240px] sm:h-[280px] md:h-[320px] lg:h-[340px]";

export function FinanceOverviewChart({
  data,
  period,
}: FinanceOverviewChartProps) {
  const isProfit = data.netProfit >= 0;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle className="md:text-lg text-base font-bold">
              รายรับ-รายจ่าย
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {periodLabel[period]}
            </CardDescription>
          </div>

          {/* Summary 3 ตัว: รายรับ / รายจ่าย / กำไร-ขาดทุน */}
          <div className="flex gap-4 sm:gap-6">
            {/* รายรับ */}
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">รายรับรวม</span>
              <span className="text-base font-semibold text-green-600">
                {formatCurrency(data.totalIncome)}
              </span>
            </div>

            {/* รายจ่าย */}
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">รายจ่ายรวม</span>
              <span className="text-base font-semibold text-red-500">
                {formatCurrency(data.totalExpense)}
              </span>
            </div>

            {/* กำไร/ขาดทุน */}
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">
                {isProfit ? "กำไรสุทธิ" : "ขาดทุน"}
              </span>
              <div className="flex items-center gap-1">
                {isProfit ? (
                  <TrendingUp className="size-3 text-green-600" />
                ) : (
                  <TrendingDown className="size-3 text-red-500" />
                )}
                <span
                  className={`text-base font-semibold ${isProfit ? "text-green-600" : "text-red-500"
                    }`}
                >
                  {formatCurrency(Math.abs(data.netProfit))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        {/* กรณีไม่มีข้อมูล */}
        {data.points.every((p) => p.income === 0 && p.expense === 0) ? (
          <div
            className={`flex items-center justify-center ${chartHeightClass} text-sm text-muted-foreground`}
          >
            ไม่มีข้อมูลธุรกรรมใน{periodLabel[period]}
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className={`aspect-auto ${chartHeightClass} w-full`}
          >
            <BarChart
              accessibilityLayer
              data={data.points}
              margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid vertical={false} className="stroke-muted" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11 }}

                // ลด label ถ้ามีหลายจุด
                interval={
                  data.points.length > 15
                    ? Math.floor(data.points.length / 10)
                    : 0
                }
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                tick={{ fontSize: 10 }}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`
                }
                width={36}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      formatCurrency(Number(value)),
                      name,
                    ]}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="income"
                fill="var(--color-emerald-400)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="expense"
                fill="var(--color-red-400)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
