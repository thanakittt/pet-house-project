"use server";

import { db } from "@/db";
import { appointments, appointmentItems, serviceVariants } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { addMinutes, parseISO, startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/types/action";

type PetBookingInput = {
  petId: string;
  mainVariantId: string;
  addOnVariantIds: string[];
};

export interface CreateMultipleAppointmentInput {
  customerId: string;
  startTimeIso: string;
  petBookings: PetBookingInput[];
  note?: string;
}

export async function createAppointment(data: CreateMultipleAppointmentInput): Promise<ActionResponse<{ appointmentId: string }>> {
  try {
    if (!data.petBookings || data.petBookings.length === 0) {
      return { success: false, error: "ไม่พบข้อมูลสัตว์เลี้ยงที่ต้องการรับบริการ" };
    }

    const initialStartTime = parseISO(data.startTimeIso);
    // แปลงเวลาเริ่มต้นเป็น Date object สำหรับฟิลด์ appointment_date (ต้องการ String รูปแบบ date ในบาง setup)
    // หาก Drizzle schema ตั้ง mode: "date" ไว้ สามารถส่ง Date object ได้เลย
    const appointmentDate = startOfDay(initialStartTime); 

    // 2. รวบรวม ID ของ Service Variant ทั้งหมดที่ถูกเรียกใช้ เพื่อนำไปค้นหาราคา
    const allVariantIds = new Set<string>();
    data.petBookings.forEach((booking) => {
      allVariantIds.add(booking.mainVariantId);
      booking.addOnVariantIds.forEach((id) => allVariantIds.add(id));
    });

    let appointmentId = "";

    // 3. เริ่มต้น Database Transaction
    await db.transaction(async (tx) => {
      
      // 3.1 ดึงข้อมูลราคาและระยะเวลาล่าสุดจากฐานข้อมูล (ป้องกัน Client แก้ไขราคา)
      const selectedVariants = await tx.query.serviceVariants.findMany({
        where: inArray(serviceVariants.id, Array.from(allVariantIds)),
      });

      // ตรวจสอบว่าบริการทั้งหมดมีอยู่จริง
      if (selectedVariants.length !== allVariantIds.size) {
        throw new Error("ข้อมูลบริการบางรายการไม่ถูกต้องหรือถูกยกเลิกไปแล้ว");
      }

      // 3.2 สร้างหัวบิลการจอง (Appointment Header)
      const [newAppointment] = await tx
        .insert(appointments)
        .values({
          appointmentDate: appointmentDate,
          customerId: data.customerId,
          status: "PENDING_DEPOSIT", 
          note: data.note || null,
        })
        .returning({ id: appointments.id });

      appointmentId = newAppointment.id;

      // 3.3 เตรียมรายการบริการ (Appointment Items) ของสัตว์เลี้ยงทุกตัว
      const itemsToInsert = [];
      let currentStartTime = initialStartTime;

      for (const booking of data.petBookings) {
        // จัดการบริการหลัก
        const mainVariant = selectedVariants.find((v) => v.id === booking.mainVariantId);
        if (!mainVariant) throw new Error(`ไม่พบบริการหลักสำหรับสัตว์เลี้ยงรหัส ${booking.petId}`);

        const mainEndTime = addMinutes(currentStartTime, mainVariant.durationMinutes || 0);
        itemsToInsert.push({
          appointmentId: newAppointment.id,
          petId: booking.petId,
          serviceVariantId: mainVariant.id,
          price: mainVariant.minPrice.toString(), 
          startTime: currentStartTime,
          endTime: mainEndTime,
        });
        
        // ขยับเวลาเพื่อเริ่มบริการเสริมตัวถัดไป
        currentStartTime = mainEndTime; 

        // จัดการบริการเสริม
        if (booking.addOnVariantIds && booking.addOnVariantIds.length > 0) {
          for (const addOnId of booking.addOnVariantIds) {
            const addOnVariant = selectedVariants.find((v) => v.id === addOnId);
            if (addOnVariant) {
              const addOnEndTime = addMinutes(currentStartTime, addOnVariant.durationMinutes || 0);
              itemsToInsert.push({
                appointmentId: newAppointment.id,
                petId: booking.petId,
                serviceVariantId: addOnVariant.id,
                price: addOnVariant.minPrice.toString(),
                startTime: currentStartTime,
                endTime: addOnEndTime,
              });
              
              // ขยับเวลาไปเรื่อยๆ จนจบการบริการของสัตว์เลี้ยงตัวนี้
              currentStartTime = addOnEndTime; 
            }
          }
        }
      } // จบลูปสัตว์เลี้ยง 1 ตัว

      // 3.4 บันทึกรายการย่อยทั้งหมดลงฐานข้อมูลในคำสั่งเดียว (Batch Insert)
      if (itemsToInsert.length > 0) {
        await tx.insert(appointmentItems).values(itemsToInsert);
      }
    });
    // สิ้นสุด Transaction: หากไม่มี Error ข้อมูลจะถูก Commit อย่างสมบูรณ์

    // 4. สั่งล้าง Cache ของระบบเพื่อแสดงคิวใหม่ในหน้าปฏิทิน
    revalidatePath("/appointments/create");
    revalidatePath("/appointments");

    return { success: true, data: { appointmentId } };
  } catch (error) {
    console.error("Create Appointment Transaction Error:", error);
    // หากเข้า catch block นี้ ข้อมูลทั้งหมดใน tx จะถูก Rollback ทันที
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  }
}