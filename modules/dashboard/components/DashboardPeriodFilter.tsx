"use client";
// ===================================================
// DashboardPeriodFilter.tsx — ตัวกรองช่วงเวลา Dashboard
// ===================================================
// Client Component: ใช้ ToggleGroup สำหรับเลือก period
// อัปเดต URL searchParam เมื่อผู้ใช้เปลี่ยน period
// ===================================================

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DashboardPeriod } from "../types/dashboard";

// ตัวเลือก period ที่แสดงให้ผู้ใช้
const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: "DAILY", label: "รายวัน" },
  { value: "MONTHLY", label: "รายเดือน" },
  { value: "YEARLY", label: "รายปี" },
];

interface DashboardPeriodFilterProps {
  /** period ปัจจุบันจาก searchParams */
  currentPeriod: DashboardPeriod;
}

export function DashboardPeriodFilter({
  currentPeriod,
}: DashboardPeriodFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // เปลี่ยน period โดยอัปเดต URL searchParam
  const handlePeriodChange = useCallback(
    (value: string) => {
      if (!value) return; // ป้องกันการ deselect ทั้งหมด
      const params = new URLSearchParams(searchParams.toString());
      params.set("period", value);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <ToggleGroup
      type="single"
      value={currentPeriod}
      onValueChange={handlePeriodChange}
      className="border rounded-lg p-1 bg-muted/50"
    >
      {PERIOD_OPTIONS.map((opt) => (
        <ToggleGroupItem
          key={opt.value}
          value={opt.value}
          aria-label={`ดูข้อมูล${opt.label}`}
          className="text-sm px-4 py-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm"
        >
          {opt.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
