"use server";

import { db } from "@/db";
import { appointments, appointmentItems } from "@/db/schema";
import { and, gte, lte, ne, eq } from "drizzle-orm";
import { addDays, addMinutes, isBefore } from "date-fns";

import {
  formatDateOnly,
  getBangkokDateAtTime,
  getBangkokDayRange,
  getBangkokTodayString,
} from "@/lib/finance/date";
import {
  getBusinessRules,
  resolveOperatingIntervals,
} from "@/modules/business-rules/business-rules";

interface GetSlotsParams {
  date: string;
  durationMinutes: number;
}

export async function getAvailableSlots({
  date,
  durationMinutes,
}: GetSlotsParams) {
  try {
    const rules = await getBusinessRules();
    const latestBookingDate = formatDateOnly(
      addDays(
        new Date(`${getBangkokTodayString()}T00:00:00Z`),
        rules.maxAdvanceBookingDays,
      ),
    );
    const operatingIntervals = resolveOperatingIntervals(rules, date);

    if (date > latestBookingDate || operatingIntervals.length === 0) {
      return { success: true, data: [] };
    }

    const { start: startOfTargetDay, end: endOfTargetDay } =
      getBangkokDayRange(date);

    // 1. Optimize Database Query
    const bookedSlots = await db
      .select({
        startTime: appointmentItems.startTime,
        endTime: appointmentItems.endTime,
      })
      .from(appointmentItems)
      .innerJoin(
        appointments,
        eq(appointmentItems.appointmentId, appointments.id),
      )
      .where(
        and(
          gte(appointmentItems.startTime, startOfTargetDay),
          lte(appointmentItems.endTime, endOfTargetDay),
          ne(appointments.status, "CANCELLED"),
          ne(appointments.status, "NO_SHOW"),
        ),
      );

    // กฎเวลาทำการและ policy ถูกดึงจาก Business Rules ชุดเดียวกับที่ server action ใช้ validate
    const now = new Date();
    const minimumBookingTime = addMinutes(now, rules.minBookingLeadMinutes);

    const availableSlots: string[] = [];
    for (const interval of operatingIntervals) {
      const [startHour, startMinute] = interval.startTime.split(":").map(Number);
      const [endHour, endMinute] = interval.endTime.split(":").map(Number);
      const openingTime = getBangkokDateAtTime(date, startHour, startMinute);
      const closingTime = getBangkokDateAtTime(date, endHour, endMinute);
      let currentSlotStart = openingTime;

      // ตรวจสอบการทับซ้อนทีละสล็อตภายในแต่ละช่วงเวลาที่ร้านเปิด
      while (isBefore(currentSlotStart, closingTime)) {
        if (isBefore(currentSlotStart, minimumBookingTime)) {
          currentSlotStart = addMinutes(
            currentSlotStart,
            rules.slotIntervalMinutes,
          );
          continue;
        }

        const currentSlotEnd = addMinutes(currentSlotStart, durationMinutes);
        if (currentSlotEnd > closingTime) break;

        const isOverlapping = bookedSlots.some(
          (slot) =>
            currentSlotStart < slot.endTime && currentSlotEnd > slot.startTime,
        );

        if (!isOverlapping) {
          availableSlots.push(currentSlotStart.toISOString());
        }

        currentSlotStart = addMinutes(
          currentSlotStart,
          rules.slotIntervalMinutes,
        );
      }
    }

    return { success: true, data: availableSlots };
  } catch (error) {
    console.error("Error generating slots:", error);
    return { success: false, error: "ไม่สามารถดึงข้อมูลคิวว่างได้" };
  }
}
