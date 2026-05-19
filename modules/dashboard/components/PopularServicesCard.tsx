// ===================================================
// PopularServicesCard.tsx — การ์ดบริการยอดนิยม TOP 5
// ===================================================
// Server Component: แสดงอันดับบริการที่ถูกใช้งานมากที่สุด
// พร้อมแถบ progress bar แสดงสัดส่วน
// ===================================================

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { PopularService, DashboardPeriod } from "../types/dashboard";
import { formatCurrency } from "@/lib/utils";

interface PopularServicesCardProps {
  services: PopularService[];
  period: DashboardPeriod;
}

// แปลง period เป็นข้อความไทย
const periodLabel: Record<DashboardPeriod, string> = {
  DAILY: "วันนี้",
  MONTHLY: "30 วันล่าสุด",
  YEARLY: "ปีนี้",
};

// สีตามอันดับ (1st = gold, 2nd = silver, 3rd = bronze, ที่เหลือ = muted)
const rankColors = [
  "text-yellow-500",  // อันดับ 1
  "text-gray-400",    // อันดับ 2
  "text-orange-500",  // อันดับ 3
  "text-muted-foreground", // อันดับ 4
  "text-muted-foreground", // อันดับ 5
];

export function PopularServicesCard({
  services,
  period,
}: PopularServicesCardProps) {
  // หาจำนวนสูงสุดสำหรับคำนวณ progress bar
  const maxCount = Math.max(...services.map((s) => s.count), 1);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="md:text-lg text-base font-bold">
            บริการยอดนิยม
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">
            TOP 5 — {periodLabel[period]}
          </CardDescription>
        </div>
        <div className="bg-yellow-500/10 p-2.5 rounded-lg">
          <Trophy className="size-4 text-yellow-500" />
        </div>
      </CardHeader>

      <CardContent>
        {services.length === 0 ? (
          // กรณีไม่มีข้อมูล
          <p className="text-sm text-muted-foreground text-center py-4">
            ไม่มีข้อมูลใน{periodLabel[period]}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {services.map((service, index) => {
              const percent = (service.count / maxCount) * 100;
              return (
                <div key={service.serviceName} className="flex flex-col gap-1">
                  {/* แถวอันดับ + ชื่อ + จำนวน */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {/* หมายเลขอันดับ */}
                      <span
                        className={`font-bold text-xs w-4 ${rankColors[index]}`}
                      >
                        {index + 1}
                      </span>
                      <span className="font-medium truncate max-w-[160px]">
                        {service.serviceName}
                      </span>
                    </div>
                    {/* จำนวน + รายได้ */}
                    <div className="flex items-center gap-2 text-xs shrink-0">
                      <span className="text-muted-foreground">
                        {service.count} ครั้ง
                      </span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(service.revenue)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-primary rounded-full h-1.5 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
