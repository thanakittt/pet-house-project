"use server";

import { db } from "@/db";
import { appointments, payments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { AppointmentStatus } from "../types/status";
import { requireStaff } from "@/lib/session";
import { APPOINTMENT_DEPOSIT_AMOUNT } from "@/lib/constants/appointment";

export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: AppointmentStatus,
) {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return { success: false, error: "คุณไม่มีสิทธิ์ในการดำเนินการนี้" };
    }

    // ใช้ Database Transaction เพื่อรับประกันว่าข้อมูลต้องอัปเดตสำเร็จทั้งคู่
    await db.transaction(async (tx) => {
      // 1. อัปเดตสถานะนัดหมาย
      const result = await tx
        .update(appointments)
        .set({ status: newStatus })
        .where(eq(appointments.id, appointmentId))
        .returning({ id: appointments.id });

      // หากไม่พบข้อมูล ให้โยน Error ออกไปเพื่อให้ Transaction ทำการ Rollback ทันที
      if (result.length === 0) {
        throw new Error("ไม่พบข้อมูลการจอง");
      }

      // 2. สร้างบิลมัดจำ 100 บาท หากสถานะเปลี่ยนเป็น CONFIRMED
      if (newStatus === "CONFIRMED") {
        // เช็คก่อนว่ามีค่ามัดจำบิลนี้หรือยัง ป้องกันการสร้างข้อมูลซ้ำซ้อน
        const existingDeposit = await tx.query.payments.findFirst({
          where: (p, { and, eq }) =>
            and(
              eq(p.appointmentId, appointmentId),
              eq(p.paymentType, "DEPOSIT"),
            ),
        });

        // หากยังไม่มีมัดจำ ให้ Insert ข้อมูลใหม่
        if (!existingDeposit) {
          await tx.insert(payments).values({
            appointmentId: appointmentId,
            amount: APPOINTMENT_DEPOSIT_AMOUNT.toFixed(2),
            paymentMethod: "TRANSFER",
            paymentDate: new Date(),
            status: "PAID",
            paymentType: "DEPOSIT",
          });
        }
      }
    });

    // ล้างแคชหน้า Detail และหน้า Schedule เพื่อให้เห็นสถานะใหม่ทันที
    revalidatePath(`/appointments/${appointmentId}`);
    revalidatePath("/appointments");

    return { success: true };
  } catch (error) {
    console.error("updateAppointmentStatus error:", error);

    // จัดการ Error Message ให้สื่อสารกับ Client ได้ชัดเจนขึ้น
    if (error instanceof Error && error.message === "ไม่พบข้อมูลการจอง") {
      return { success: false, error: error.message };
    }
    return { success: false, error: "ไม่สามารถเปลี่ยนสถานะได้" };
  }
}
