import "server-only";

import { asc, eq, inArray } from "drizzle-orm";
import { addDays, addMinutes, isBefore } from "date-fns";
import { db } from "@/db";
import {
  businessDateOverrideHours,
  businessDateOverrides,
  businessRules,
  businessWeeklyHours,
} from "@/db/schema";
import {
  formatDateOnly,
  getBangkokDateAtTime,
  getBangkokDayOfWeek,
  getBangkokTodayString,
} from "@/lib/finance/date";
import type {
  BusinessRules,
  OperatingInterval,
  TimeRange,
} from "./types/business-rules";
import {
  type UpdateBusinessRulesInput,
  updateBusinessRulesSchema,
} from "./validation";

const DEFAULT_WEEKLY_HOURS = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  intervals:
    dayOfWeek === 3 ? [] : [{ startTime: "09:00", endTime: "18:00" }],
}));

export const DEFAULT_BUSINESS_RULES: BusinessRules = {
  minBookingLeadMinutes: 0,
  maxAdvanceBookingDays: 90,
  slotIntervalMinutes: 30,
  weeklyHours: DEFAULT_WEEKLY_HOURS,
  dateOverrides: [],
};

function toTimeRange(startTime: string, endTime: string): TimeRange {
  return {
    startTime: startTime.slice(0, 5),
    endTime: endTime.slice(0, 5),
  };
}

export async function getBusinessRules(): Promise<BusinessRules> {
  const rule = await db.query.businessRules.findFirst({
    columns: {
      id: true,
      minBookingLeadMinutes: true,
      maxAdvanceBookingDays: true,
      slotIntervalMinutes: true,
    },
  });

  if (!rule) return DEFAULT_BUSINESS_RULES;

  const [weeklyHours, overrides] = await Promise.all([
    db
      .select({
        dayOfWeek: businessWeeklyHours.dayOfWeek,
        startTime: businessWeeklyHours.startTime,
        endTime: businessWeeklyHours.endTime,
      })
      .from(businessWeeklyHours)
      .where(eq(businessWeeklyHours.businessRuleId, rule.id))
      .orderBy(asc(businessWeeklyHours.dayOfWeek), asc(businessWeeklyHours.startTime)),
    db
      .select({
        id: businessDateOverrides.id,
        date: businessDateOverrides.date,
        isClosed: businessDateOverrides.isClosed,
      })
      .from(businessDateOverrides)
      .where(eq(businessDateOverrides.businessRuleId, rule.id))
      .orderBy(asc(businessDateOverrides.date)),
  ]);

  const overrideHours = overrides.length
    ? await db
        .select({
          businessDateOverrideId: businessDateOverrideHours.businessDateOverrideId,
          startTime: businessDateOverrideHours.startTime,
          endTime: businessDateOverrideHours.endTime,
        })
        .from(businessDateOverrideHours)
        .where(
          inArray(
            businessDateOverrideHours.businessDateOverrideId,
            overrides.map((override) => override.id),
          ),
        )
        .orderBy(asc(businessDateOverrideHours.startTime))
    : [];

  return {
    minBookingLeadMinutes: rule.minBookingLeadMinutes,
    maxAdvanceBookingDays: rule.maxAdvanceBookingDays,
    slotIntervalMinutes: rule.slotIntervalMinutes,
    weeklyHours: DEFAULT_WEEKLY_HOURS.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      intervals: weeklyHours
        .filter((hour) => hour.dayOfWeek === day.dayOfWeek)
        .map((hour) => toTimeRange(hour.startTime, hour.endTime)),
    })),
    dateOverrides: overrides.map((override) => ({
      date: override.date,
      isClosed: override.isClosed,
      intervals: overrideHours
        .filter((hour) => hour.businessDateOverrideId === override.id)
        .map((hour) => toTimeRange(hour.startTime, hour.endTime)),
    })),
  };
}

export function resolveOperatingIntervals(
  rules: BusinessRules,
  date: string,
): OperatingInterval[] {
  const override = rules.dateOverrides.find((item) => item.date === date);
  if (override) return override.isClosed ? [] : override.intervals;

  return (
    rules.weeklyHours.find((item) => item.dayOfWeek === getBangkokDayOfWeek(date))
      ?.intervals ?? []
  );
}

function getIntervalDates(date: string, interval: OperatingInterval) {
  const [startHour, startMinute] = interval.startTime.split(":").map(Number);
  const [endHour, endMinute] = interval.endTime.split(":").map(Number);
  return {
    start: getBangkokDateAtTime(date, startHour, startMinute),
    end: getBangkokDateAtTime(date, endHour, endMinute),
  };
}

export function getOperatingIntervalForTime(
  rules: BusinessRules,
  date: string,
  startTime: Date,
  durationMinutes: number,
) {
  const endTime = addMinutes(startTime, durationMinutes);
  return resolveOperatingIntervals(rules, date).find((interval) => {
    const dates = getIntervalDates(date, interval);
    return startTime >= dates.start && endTime <= dates.end;
  });
}

export function validateBookingTime({
  rules,
  startTime,
  durationMinutes,
  now = new Date(),
}: {
  rules: BusinessRules;
  startTime: Date;
  durationMinutes: number;
  now?: Date;
}): string | null {
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return "ระยะเวลาบริการไม่ถูกต้อง";
  }

  const date = formatDateOnly(startTime);
  const bookingMinimumTime = addMinutes(now, rules.minBookingLeadMinutes);
  const latestBookingDate = formatDateOnly(
    addDays(new Date(`${getBangkokTodayString()}T00:00:00Z`), rules.maxAdvanceBookingDays),
  );

  if (isBefore(startTime, bookingMinimumTime)) {
    return "เวลานี้กระชั้นชิดเกินกว่าที่ร้านกำหนด";
  }

  if (date > latestBookingDate) {
    return "วันที่เลือกเกินระยะเวลาจองล่วงหน้าที่ร้านกำหนด";
  }

  const interval = getOperatingIntervalForTime(rules, date, startTime, durationMinutes);
  if (!interval) {
    return "เวลานัดหมายต้องอยู่ภายในเวลาทำการของร้าน";
  }

  const intervalStart = getIntervalDates(date, interval).start;
  const differenceMinutes = Math.round(
    (startTime.getTime() - intervalStart.getTime()) / 60_000,
  );
  if (differenceMinutes % rules.slotIntervalMinutes !== 0) {
    return "เวลาเริ่มนัดหมายไม่ตรงกับช่วงสล็อตที่ร้านกำหนด";
  }

  return null;
}

export async function replaceBusinessRules(input: UpdateBusinessRulesInput) {
  const parsed = updateBusinessRulesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  await db.transaction(async (tx) => {
    const existingRule = await tx.query.businessRules.findFirst({
      columns: { id: true },
    });
    const [rule] = existingRule
      ? await tx
          .update(businessRules)
          .set({
            minBookingLeadMinutes: parsed.data.minBookingLeadMinutes,
            maxAdvanceBookingDays: parsed.data.maxAdvanceBookingDays,
            slotIntervalMinutes: parsed.data.slotIntervalMinutes,
          })
          .where(eq(businessRules.id, existingRule.id))
          .returning({ id: businessRules.id })
      : await tx
          .insert(businessRules)
          .values({
            minBookingLeadMinutes: parsed.data.minBookingLeadMinutes,
            maxAdvanceBookingDays: parsed.data.maxAdvanceBookingDays,
            slotIntervalMinutes: parsed.data.slotIntervalMinutes,
          })
          .returning({ id: businessRules.id });

    await tx.delete(businessWeeklyHours).where(eq(businessWeeklyHours.businessRuleId, rule.id));
    await tx.delete(businessDateOverrides).where(eq(businessDateOverrides.businessRuleId, rule.id));

    const weeklyHours = parsed.data.weeklyHours.flatMap((day) =>
      day.intervals.map((interval) => ({
        businessRuleId: rule.id,
        dayOfWeek: day.dayOfWeek,
        startTime: interval.startTime,
        endTime: interval.endTime,
      })),
    );
    if (weeklyHours.length) await tx.insert(businessWeeklyHours).values(weeklyHours);

    for (const override of parsed.data.dateOverrides) {
      const [newOverride] = await tx
        .insert(businessDateOverrides)
        .values({
          businessRuleId: rule.id,
          date: override.date,
          isClosed: override.isClosed,
        })
        .returning({ id: businessDateOverrides.id });

      const overrideIntervals = override.isClosed ? [] : override.intervals;
      if (overrideIntervals.length) {
        await tx.insert(businessDateOverrideHours).values(
          overrideIntervals.map((interval) => ({
            businessDateOverrideId: newOverride.id,
            startTime: interval.startTime,
            endTime: interval.endTime,
          })),
        );
      }
    }
  });

  return { success: true as const };
}
