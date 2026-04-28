"use server";

import { db } from "@/db";
import { appointments, appointmentItems, serviceVariants } from "@/db/schema";
import { inArray, and, or, lt, gt, eq } from "drizzle-orm";
import { addMinutes, parseISO, startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/types/action";
import { requireStaff } from "@/lib/session";
import { SHOP_CLOSED_DAY } from "@/lib/constants/appointment";

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

export async function createAppointment(
  data: CreateMultipleAppointmentInput,
): Promise<ActionResponse<{ appointmentId: string }>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return { success: false, error: "คุณไม่มีสิทธิ์ในการดำเนินการนี้" };
    }

    if (!data.petBookings || data.petBookings.length === 0) {
      return {
        success: false,
        error: "ไม่พบข้อมูลสัตว์เลี้ยงที่ต้องการรับบริการ",
      };
    }

    const initialStartTime = parseISO(data.startTimeIso);

    // ใช้แยกส่วน String แล้วประกอบใหม่ด้วย 'Z' (UTC)
    const dateString = data.startTimeIso.split("T")[0]; // "2026-04-28"
    const appointmentDate = new Date(`${dateString}T00:00:00Z`); // บังคับเป็น Date object ตาม UTC

    if (appointmentDate.getDay() === SHOP_CLOSED_DAY) {
      return {
        success: false,
        error: "ไม่สามารถจองคิวในวันหยุดของร้านได้",
      };
    }

    // 1. รวบรวม ID ของ Service Variant ทั้งหมดที่ถูกเรียกใช้ เพื่อนำไปค้นหาราคา
    const allVariantIds = new Set<string>();
    data.petBookings.forEach((booking) => {
      allVariantIds.add(booking.mainVariantId);
      booking.addOnVariantIds.forEach((id) => allVariantIds.add(id));
    });

    let appointmentId = "";

    // 2. เริ่มต้น Database Transaction
    await db.transaction(async (tx) => {
      // 2.1 ดึงข้อมูลราคาและระยะเวลาล่าสุดจากฐานข้อมูล (ป้องกัน Client แก้ไขราคา)
      const selectedVariants = await tx.query.serviceVariants.findMany({
        where: inArray(serviceVariants.id, Array.from(allVariantIds)),
      });

      // ตรวจสอบว่าบริการทั้งหมดมีอยู่จริง
      if (selectedVariants.length !== allVariantIds.size) {
        throw new Error("ข้อมูลบริการบางรายการไม่ถูกต้องหรือถูกยกเลิกไปแล้ว");
      }

      // 2.2 สร้างหัวบิลการจอง (Appointment Header)
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

      // 2.3 เตรียมรายการบริการ (Appointment Items) ของสัตว์เลี้ยงทุกตัว
      const itemsToInsert = [];
      let currentStartTime = initialStartTime;

      for (const booking of data.petBookings) {
        // จัดการบริการหลัก
        const mainVariant = selectedVariants.find(
          (v) => v.id === booking.mainVariantId,
        );
        if (!mainVariant)
          throw new Error(
            `ไม่พบบริการหลักสำหรับสัตว์เลี้ยงรหัส ${booking.petId}`,
          );

        const mainEndTime = addMinutes(
          currentStartTime,
          mainVariant.durationMinutes || 0,
        );
        itemsToInsert.push({
          appointmentId: newAppointment.id,
          petId: booking.petId,
          serviceVariantId: mainVariant.id,
          price: mainVariant.minPrice.toString(),
          startTime: currentStartTime,
          endTime: mainEndTime,
        });

        currentStartTime = mainEndTime;

        // จัดการบริการเสริม
        if (booking.addOnVariantIds && booking.addOnVariantIds.length > 0) {
          for (const addOnId of booking.addOnVariantIds) {
            const addOnVariant = selectedVariants.find((v) => v.id === addOnId);
            if (addOnVariant) {
              const addOnEndTime = addMinutes(
                currentStartTime,
                addOnVariant.durationMinutes || 0,
              );
              itemsToInsert.push({
                appointmentId: newAppointment.id,
                petId: booking.petId,
                serviceVariantId: addOnVariant.id,
                price: addOnVariant.minPrice.toString(),
                startTime: currentStartTime,
                endTime: addOnEndTime,
              });

              currentStartTime = addOnEndTime;
            }
          }
        }
      }

      // 2.4 ตรวจสอบ Collision และบันทึกรายการย่อย (Batch Insert)
      if (itemsToInsert.length > 0) {
        // 2.4.1 สร้างเงื่อนไข Overlap Check (เริ่มก่อนจบ และจบหลังเริ่ม)
        const overlapConditions = itemsToInsert.map((item) =>
          and(
            lt(appointmentItems.startTime, item.endTime),
            gt(appointmentItems.endTime, item.startTime),
          ),
        );

        // 2.4.2 ดึงข้อมูลและล็อค Row ด้วย FOR UPDATE
        const collisions = await tx
          .select({ id: appointmentItems.id })
          .from(appointmentItems)
          .innerJoin(
            appointments,
            eq(appointmentItems.appointmentId, appointments.id),
          )
          .where(
            and(
              eq(appointments.appointmentDate, appointmentDate),
              inArray(appointments.status, [
                "PENDING_DEPOSIT",
                "PENDING_APPROVAL",
                "CONFIRMED",
                "CHECKED_IN",
                "IN_PROGRESS",
                "READY_FOR_PICKUP",
              ]), // ละเว้นการตรวจจับคิวที่ถูก CANCELLED หรือ NO_SHOW ไปแล้ว
              or(...overlapConditions),
            ),
          )
          .for("update");

        // 2.4.3 หากเจอทับซ้อน ให้โยน Error เพื่อ Rollback ทันที
        if (collisions.length > 0) {
          throw new Error(
            "เกิดข้อผิดพลาด: มีบางช่วงเวลาถูกจองไปแล้วในขณะที่คุณกำลังทำรายการ กรุณารีเฟรชและเลือกเวลาใหม่",
          );
        }

        // 2.4.4 บันทึกลงฐานข้อมูลหากปลอดภัยจากการทับซ้อน
        await tx.insert(appointmentItems).values(itemsToInsert);
      }
    });

    // 3. สั่งล้าง Cache ของระบบเพื่ออัปเดต UI ปฏิทิน
    revalidatePath("/appointments/create");
    revalidatePath("/appointments");

    return { success: true, data: { appointmentId } };
  } catch (error) {
    console.error("Create Appointment Transaction Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
    };
  }
}
