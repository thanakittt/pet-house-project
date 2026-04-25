// modules/appointment/actions/get-schedule.ts
"use server";

import { db } from "@/db";
import { appointments, appointmentItems } from "@/db/schema"; // นำเข้าตารางของคุณ
// สมมติว่าคุณมีตารางเหล่านี้ (กรุณาปรับ path ตามจริง)
import { customers, pets, serviceVariants, services } from "@/db/schema";
import { and, eq, gte, lte, not } from "drizzle-orm";
import { startOfDay, endOfDay, parseISO } from "date-fns";
import { ScheduleRecord } from "../types/schedule";
import { ActionResponse } from "@/types/action";

export async function getScheduleByDate(
  dateString: string,
): Promise<ActionResponse<ScheduleRecord[]>> {
  try {
    const targetDate = parseISO(dateString);
    const start = startOfDay(targetDate);
    const end = endOfDay(targetDate);

    // 1. คิวรีข้อมูลจาก Database ด้วย Query Builder (เพื่อความชัวร์แม้ไม่ได้เซ็ต Relations)
    const rawItems = await db
      .select({
        itemId: appointmentItems.id,
        appointmentId: appointments.id,
        status: appointments.status,
        startTime: appointmentItems.startTime,
        endTime: appointmentItems.endTime,
        customerId: customers.id,
        customerName: customers.nickname, // หรือ name ตาม schema ของคุณ
        petId: pets.id,
        petName: pets.name,
        // สมมติโครงสร้างบริการของคุณ
        serviceName: services.name,
      })
      .from(appointmentItems)
      .innerJoin(
        appointments,
        eq(appointmentItems.appointmentId, appointments.id),
      )
      .innerJoin(customers, eq(appointments.customerId, customers.id))
      .innerJoin(pets, eq(appointmentItems.petId, pets.id))
      .innerJoin(
        serviceVariants,
        eq(appointmentItems.serviceVariantId, serviceVariants.id),
      )
      .innerJoin(services, eq(serviceVariants.serviceId, services.id))
      .where(
        and(
          gte(appointmentItems.startTime, start),
          lte(appointmentItems.startTime, end),
          not(eq(appointments.status, "CANCELLED")),
        ),
      )
      .orderBy(appointmentItems.startTime);

    // 2. จัดกลุ่มข้อมูล (Group by Appointment + Pet)
    // เพราะสัตว์เลี้ยง 1 ตัว อาจมี 2 รายการ (เช่น อาบน้ำ + ตัดเล็บ) ที่เวลาติดกัน
    const groupedMap = new Map<string, ScheduleRecord>();

    rawItems.forEach((item) => {
      const groupKey = `${item.appointmentId}-${item.petId}`; // สร้าง Key เฉพาะสัตว์เลี้ยงในคิวนั้น
      const existing = groupedMap.get(groupKey);

      if (existing) {
        // หากมีกลุ่มอยู่แล้ว ให้บวกชื่อบริการเพิ่ม และอัปเดตเวลาสิ้นสุด (endTime)
        existing.serviceNames += ` + ${item.serviceName}`;
        if (item.endTime > parseISO(existing.endTimeIso)) {
          existing.endTimeIso = item.endTime.toISOString();
        }
      } else {
        // หากยังไม่มี ให้สร้าง Record ใหม่
        groupedMap.set(groupKey, {
          id: item.appointmentId,
          petId: item.petId,
          petName: item.petName,
          customerName: item.customerName,
          serviceNames: item.serviceName,
          startTimeIso: item.startTime.toISOString(),
          endTimeIso: item.endTime.toISOString(),
          status: item.status as ScheduleRecord["status"],
        });
      }
    });

    // 3. แปลง Map กลับเป็น Array
    const scheduleData = Array.from(groupedMap.values());

    return { success: true, data: scheduleData };
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return { success: false, error: "ไม่สามารถดึงข้อมูลตารางงานได้" };
  }
}
