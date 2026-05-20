// ===================================================
// AppointmentSummaryCard.tsx — การ์ดสรุปการจองคิว
// ===================================================
// Server Component: แสดงจำนวนนัดหมายแยกตาม status
// พร้อม badge สีตาม status
// ===================================================

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck } from "lucide-react";
import { AppointmentSummary, DashboardPeriod } from "../types/dashboard";

interface AppointmentSummaryCardProps {
  summary: AppointmentSummary;
  period: DashboardPeriod;
}

// แปลง period เป็นข้อความไทย
const periodLabel: Record<DashboardPeriod, string> = {
  DAILY: "วันนี้",
  MONTHLY: "30 วันล่าสุด",
  YEARLY: "ปีนี้",
};

export function AppointmentSummaryCard({
  summary,
  period,
}: AppointmentSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="md:text-base text-sm font-bold">
            การจองคิว
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">
            {periodLabel[period]}
          </CardDescription>
        </div>
        {/* ไอคอนพื้นหลัง */}
        <div className="bg-primary/10 p-2.5 rounded-lg">
          <CalendarCheck className="text-primary" />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {/* จำนวนรวม */}
        <div className="text-2xl font-bold">{summary.total.toLocaleString()}</div>

        {/* แยกตาม status */}
        <div className="flex flex-wrap gap-2 text-xs">
          {/* กำลังดำเนินการ */}
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="py-0 px-2">
              {summary.active}
            </Badge>
            <span className="text-muted-foreground">กำลังดำเนินการ</span>
          </div>

          {/* เสร็จสิ้น */}
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="py-0 px-2">
              {summary.completed}
            </Badge>
            <span className="text-muted-foreground">เสร็จสิ้น</span>
          </div>

          {/* ยกเลิก/ไม่มา */}
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="py-0 px-2">
              {summary.cancelled}
            </Badge>
            <span className="text-muted-foreground">ยกเลิก</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
