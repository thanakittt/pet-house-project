// ===================================================
// date-range.ts — Utility สำหรับคำนวณช่วงวันที่ Dashboard
// ===================================================
// ใช้ date-fns เพื่อคำนวณ start/end ของแต่ละ period
// รองรับ: DAILY (วันนี้ทั้งวัน), MONTHLY (30 วันล่าสุด), YEARLY (ปีนี้)
// ===================================================

import {
  startOfDay,
  endOfDay,
  subDays,
  startOfYear,
  endOfYear,
} from "date-fns";
import { DashboardPeriod } from "../types/dashboard";

// ช่วงวันที่สำหรับ period ปัจจุบัน
export type DateRange = {
  startDate: Date;
  endDate: Date;
};

/**
 * คืนค่าช่วงวันที่สำหรับ period ที่เลือก
 * - DAILY: ตั้งแต่ต้นวันจนสิ้นวันของวันนี้ (สำหรับ chart แบ่งเป็นชั่วโมง)
 * - MONTHLY: 30 วันล่าสุด (นับจากวันนี้ย้อนกลับ)
 * - YEARLY: ตั้งแต่ต้นปีจนสิ้นปีของปีนี้
 */
export function getDateRange(
  period: DashboardPeriod,
  baseDate: Date = new Date()
): DateRange {
  switch (period) {
    case "DAILY":
      // วันนี้เท่านั้น (00:00 - 23:59)
      return {
        startDate: startOfDay(baseDate),
        endDate: endOfDay(baseDate),
      };

    case "MONTHLY":
      // 30 วันล่าสุด ย้อนหลังจากวันนี้
      return {
        startDate: startOfDay(subDays(baseDate, 29)), // -29 วัน + วันนี้ = 30 วัน
        endDate: endOfDay(baseDate),
      };

    case "YEARLY":
      // ปีนี้ตั้งแต่ 1 ม.ค. ถึง 31 ธ.ค.
      return {
        startDate: startOfYear(baseDate),
        endDate: endOfYear(baseDate),
      };
  }
}

/**
 * คืนค่าช่วงวันที่ของ period ก่อนหน้า (สำหรับคำนวณ % เปลี่ยนแปลง)
 * - DAILY: เมื่อวาน
 * - MONTHLY: 30 วันก่อนหน้าช่วง 30 วันล่าสุด (วันที่ 31-60 ที่แล้ว)
 * - YEARLY: ปีที่แล้ว
 */
export function getPreviousDateRange(
  period: DashboardPeriod,
  baseDate: Date = new Date()
): DateRange {
  switch (period) {
    case "DAILY":
      // เมื่อวาน
      return {
        startDate: startOfDay(subDays(baseDate, 1)),
        endDate: endOfDay(subDays(baseDate, 1)),
      };

    case "MONTHLY":
      // 30 วันก่อนหน้า (วันที่ 31-60 ที่แล้ว)
      return {
        startDate: startOfDay(subDays(baseDate, 59)),
        endDate: endOfDay(subDays(baseDate, 30)),
      };

    case "YEARLY":
      // ปีที่แล้ว
      const lastYear = new Date(baseDate.getFullYear() - 1, 0, 1);
      return {
        startDate: startOfYear(lastYear),
        endDate: endOfYear(lastYear),
      };
  }
}
