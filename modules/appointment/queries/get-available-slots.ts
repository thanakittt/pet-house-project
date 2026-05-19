"use server";

import { db } from "@/db";
import { appointments, appointmentItems } from "@/db/schema";
import { and, gte, lte, ne, eq } from "drizzle-orm";
import { addMinutes, isBefore } from "date-fns";

import { SHOP_CLOSED_DAY } from "@/lib/constants/appointment";
import {
  getBangkokDateAtTime,
  getBangkokDayOfWeek,
  getBangkokDayRange,
} from "@/lib/finance/date";

interface GetSlotsParams {
  date: string;
  durationMinutes: number;
}

export async function getAvailableSlots({
  date,
  durationMinutes,
}: GetSlotsParams) {
  try {
    if (getBangkokDayOfWeek(date) === SHOP_CLOSED_DAY) {
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

    // 2. กำหนดเวลาเปิด-ปิดร้าน และเงื่อนไขเวลา
    const openingTime = getBangkokDateAtTime(date, 9, 0);
    const closingTime = getBangkokDateAtTime(date, 18, 0);
    const slotInterval = 30; // ตัดสล็อตทุกๆ 30 นาที

    // [NEW] กำหนดเวลาปัจจุบัน (สามารถตั้ง Lead Time ได้ในอนาคต เช่น addMinutes(now, 30))
    const now = new Date();
    const minimumBookingTime = addMinutes(now, 0);

    const availableSlots: string[] = [];
    let currentSlotStart = openingTime;

    // 3. ตรวจสอบการทับซ้อนทีละสล็อต
    while (isBefore(currentSlotStart, closingTime)) {
      // [NEW] ข้ามสล็อตนี้ทันที ถ้าเวลาเริ่มของสล็อตนี้ น้อยกว่า เวลาที่อนุญาตให้จองได้ (อดีต หรือกระชั้นชิดเกินไป)
      if (isBefore(currentSlotStart, minimumBookingTime)) {
        currentSlotStart = addMinutes(currentSlotStart, slotInterval);
        continue;
      }

      const currentSlotEnd = addMinutes(currentSlotStart, durationMinutes);

      // ตรวจสอบว่าเวลาสิ้นสุดของคิวนี้ เกินเวลาปิดร้านหรือไม่
      if (isBefore(closingTime, currentSlotEnd)) {
        break;
      }

      // ตรวจสอบ Collision
      const isOverlapping = bookedSlots.some((slot) => {
        return (
          currentSlotStart < slot.endTime && currentSlotEnd > slot.startTime
        );
      });

      // หากไม่ทับซ้อน ให้เพิ่มเข้าในรายการคิวว่าง
      if (!isOverlapping) {
        availableSlots.push(currentSlotStart.toISOString());
      }

      // ขยับไปสล็อตถัดไป (+30 นาที)
      currentSlotStart = addMinutes(currentSlotStart, slotInterval);
    }

    return { success: true, data: availableSlots };
  } catch (error) {
    console.error("Error generating slots:", error);
    return { success: false, error: "ไม่สามารถดึงข้อมูลคิวว่างได้" };
  }
}
