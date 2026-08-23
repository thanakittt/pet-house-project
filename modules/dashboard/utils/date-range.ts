// ===================================================
// date-range.ts — Utility สำหรับคำนวณช่วงวันที่ Dashboard
// ===================================================
// ใช้ date-fns เพื่อคำนวณ start/end ของแต่ละ period
// รองรับ: DAILY (วันนี้ทั้งวัน), MONTHLY (30 วันล่าสุด), YEARLY (ปีนี้)
// ===================================================

import { differenceInCalendarDays, subDays } from "date-fns";
import {
  formatDateOnly,
  getBangkokDateAtTime,
  getBangkokDayRange,
} from "@/lib/finance/date";
import { formatThaiDate } from "@/lib/utils";
import type {
  DashboardChartGranularity,
  DashboardFilter,
  DashboardPeriod,
} from "../types/dashboard";

// ช่วงวันที่สำหรับ period ปัจจุบัน
export type DateRange = {
  startDate: Date;
  endDate: Date;
};

export type DashboardSearchParams = {
  period?: string | string[];
  from?: string | string[];
  to?: string | string[];
};

export type ResolvedDashboardFilter = {
  filter: DashboardFilter;
  needsCanonicalRedirect: boolean;
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PRESET_PERIODS: DashboardPeriod[] = ["DAILY", "MONTHLY", "YEARLY"];

function isValidDateOnly(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_ONLY_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function getInclusiveDayCount(startDateValue: string, endDateValue: string) {
  const start = new Date(`${startDateValue}T12:00:00.000Z`);
  const end = new Date(`${endDateValue}T12:00:00.000Z`);
  return differenceInCalendarDays(end, start) + 1;
}

function getGranularity(
  startDateValue: string,
  endDateValue: string,
): DashboardChartGranularity {
  const days = getInclusiveDayCount(startDateValue, endDateValue);
  if (days <= 31) return "DAY";
  if (days <= 731) return "MONTH";
  return "YEAR";
}

function createFilter(
  period: DashboardPeriod,
  startDateValue: string,
  endDateValue: string,
  label: string,
): DashboardFilter {
  const { start: startDate } = getBangkokDayRange(startDateValue);
  const { end: endDate } = getBangkokDayRange(endDateValue);
  return {
    period,
    startDate,
    endDate,
    startDateValue,
    endDateValue,
    label,
    chartGranularity:
      period === "YEARLY"
        ? "MONTH"
        : period === "MONTHLY"
          ? "DAY"
          : period === "DAILY"
            ? "DAY"
            : getGranularity(startDateValue, endDateValue),
  };
}

export function getDefaultCustomDateValues(baseDate = new Date()) {
  const today = formatDateOnly(baseDate);
  const todayStart = getBangkokDateAtTime(today, 0, 0);
  return { from: formatDateOnly(subDays(todayStart, 29)), to: today };
}

export function resolveDashboardFilter(
  searchParams: DashboardSearchParams,
  baseDate = new Date(),
): ResolvedDashboardFilter {
  const rawPeriod = typeof searchParams.period === "string" ? searchParams.period : undefined;
  const period: DashboardPeriod =
    rawPeriod === "CUSTOM" || PRESET_PERIODS.includes(rawPeriod as DashboardPeriod)
      ? (rawPeriod as DashboardPeriod)
      : "MONTHLY";

  if (period === "CUSTOM") {
    const from = searchParams.from;
    const to = searchParams.to;
    const today = formatDateOnly(baseDate);
    const valid =
      isValidDateOnly(from) &&
      isValidDateOnly(to) &&
      from <= to &&
      to <= today;
    const values = valid ? { from, to } : getDefaultCustomDateValues(baseDate);
    const label = `${formatThaiDate(values.from)} – ${formatThaiDate(values.to)}`;
    return {
      filter: createFilter("CUSTOM", values.from, values.to, label),
      needsCanonicalRedirect: !valid,
    };
  }

  const today = formatDateOnly(baseDate);
  const todayStart = getBangkokDateAtTime(today, 0, 0);
  if (period === "DAILY") {
    return {
      filter: createFilter(period, today, today, "วันนี้"),
      needsCanonicalRedirect: false,
    };
  }
  if (period === "YEARLY") {
    const year = today.slice(0, 4);
    return {
      filter: createFilter(period, `${year}-01-01`, `${year}-12-31`, "ปีนี้"),
      needsCanonicalRedirect: false,
    };
  }
  const from = formatDateOnly(subDays(todayStart, 29));
  return {
    filter: createFilter(period, from, today, "30 วันล่าสุด"),
    needsCanonicalRedirect: false,
  };
}

export function getCanonicalCustomUrl(filter: DashboardFilter): string {
  return `/back-office/dashboard?period=CUSTOM&from=${filter.startDateValue}&to=${filter.endDateValue}`;
}

export function getPreviousFilterDateRange(filter: DashboardFilter): DateRange {
  const dayCount = getInclusiveDayCount(filter.startDateValue, filter.endDateValue);
  const previousEndValue = formatDateOnly(subDays(filter.startDate, 1));
  const previousStartValue = formatDateOnly(subDays(filter.startDate, dayCount));
  return {
    startDate: getBangkokDayRange(previousStartValue).start,
    endDate: getBangkokDayRange(previousEndValue).end,
  };
}
