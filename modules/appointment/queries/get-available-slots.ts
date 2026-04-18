"use server";

import { db } from "@/db";
import { appointments, appointmentItems } from "@/db/schema";
import { and, gte, lte, ne, eq } from "drizzle-orm";
import { addMinutes, isBefore, parseISO, setHours, setMinutes, startOfDay } from "date-fns";


interface GetSlotsParams {
  date: string;
  durationMinutes: number;
}

export async function getAvailableSlots({
  date,
  durationMinutes,
}: GetSlotsParams) {
  try {
    const targetDate = parseISO(date);
    const startOfTargetDay = startOfDay(targetDate);
    const endOfTargetDay = addMinutes(startOfTargetDay, 24 * 60 - 1);

    // 1. Optimize Database Query: คิวรีที่ appointmentItems โดยตรงแล้ว Join กับ appointments
    // เพื่อให้ Database ประมวลผลและดึงมาเฉพาะช่วงเวลาของวันนั้นจริงๆ (ลด Memory Usage ฝั่ง Server)
    const bookedSlots = await db
      .select({
        startTime: appointmentItems.startTime,
        endTime: appointmentItems.endTime,
      })
      .from(appointmentItems)
      .innerJoin(
        appointments,
        eq(appointmentItems.appointmentId, appointments.id) 
      )
      .where(
        and(
          gte(appointmentItems.startTime, startOfTargetDay),
          lte(appointmentItems.endTime, endOfTargetDay),
          ne(appointments.status, "CANCELLED"),
          ne(appointments.status, "NO_SHOW")
        )
      );

    // 2. กำหนดเวลาเปิด-ปิดร้าน (สามารถดึงจาก Database/Settings ของร้านได้ในอนาคต)
    const openingTime = setMinutes(setHours(targetDate, 9), 0);
    const closingTime = setMinutes(setHours(targetDate, 18), 0);
    const slotInterval = 30; // ตัดสล็อตทุกๆ 30 นาที

    const availableSlots: string[] = [];
    let currentSlotStart = openingTime;

    // 3. ตรวจสอบการทับซ้อนทีละสล็อต
    while (isBefore(currentSlotStart, closingTime)) {
      const currentSlotEnd = addMinutes(currentSlotStart, durationMinutes);

      // ตรวจสอบว่าเวลาสิ้นสุดของคิวนี้ เกินเวลาปิดร้านหรือไม่
      if (isBefore(closingTime, currentSlotEnd)) {
        break;
      }

      // ตรวจสอบ Collision: ใช้ .some() เพื่อหยุดเช็คทันทีที่เจอช่วงเวลาทับซ้อน (O(N) => Best case O(1))
      const isOverlapping = bookedSlots.some((slot) => {
        return (
          currentSlotStart < slot.endTime &&
          currentSlotEnd > slot.startTime
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