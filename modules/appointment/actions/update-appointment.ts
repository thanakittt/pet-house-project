"use server";

import { db } from "@/db";
import { payments } from "@/db/schema";
import { APPOINTMENT_DEPOSIT_AMOUNT } from "@/lib/constants/appointment";
import { formatDateOnly } from "@/lib/finance/date";
import { recordTransaction } from "@/lib/finance/record-transaction";
import { requireStaff } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { AppointmentStatus } from "../types/status";
import {
  APPOINTMENT_NOT_FOUND_ERROR,
  notifyCustomerAppointmentStatusChange,
  notifyStaffConfirmedAppointment,
  updateAppointmentStatusInTransaction,
} from "./status-workflow";

export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: AppointmentStatus,
) {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return { success: false, error: "คุณไม่มีสิทธิ์ในการดำเนินการนี้" };
    }

    let statusChanged = false;

    await db.transaction(async (tx) => {
      const today = new Date();

      // อัปเดตสถานะผ่าน helper กลาง เพื่อกัน logic ซ้ำกับ flow อื่น เช่น POS
      const statusResult = await updateAppointmentStatusInTransaction(
        tx,
        appointmentId,
        newStatus,
      );
      statusChanged = statusResult.statusChanged;

      // สถานะ CONFIRMED ยังต้องสร้างบิลมัดจำตาม behavior เดิมของระบบ
      if (newStatus === "CONFIRMED") {
        const existingDeposit = await tx.query.payments.findFirst({
          where: (paymentTable, { and, eq }) =>
            and(
              eq(paymentTable.appointmentId, appointmentId),
              eq(paymentTable.paymentType, "DEPOSIT"),
            ),
        });

        if (!existingDeposit) {
          await tx.insert(payments).values({
            appointmentId: appointmentId,
            amount: APPOINTMENT_DEPOSIT_AMOUNT.toFixed(2),
            paymentMethod: "TRANSFER",
            paymentDate: formatDateOnly(today),
            status: "PAID",
            paymentType: "DEPOSIT",
          });

          await recordTransaction(tx, {
            amount: APPOINTMENT_DEPOSIT_AMOUNT,
            transactionDate: today,
            categoryType: "INCOME",
            categoryName: "รายรับมัดจำการนัดหมาย",
            note: `มัดจำนัดหมาย #${appointmentId}`,
          });
        }
      }
    });

    // ส่ง LINE หลัง transaction สำเร็จเท่านั้น เพื่อไม่แจ้งสถานะที่ถูก rollback
    await notifyCustomerAppointmentStatusChange({
      appointmentId,
      newStatus,
      statusChanged,
    });
    await notifyStaffConfirmedAppointment({
      appointmentId,
      newStatus,
      statusChanged,
    });

    revalidatePath(`/appointments/${appointmentId}`);
    revalidatePath("/appointments");

    return { success: true };
  } catch (error) {
    console.error("updateAppointmentStatus error:", error);

    if (error instanceof Error && error.message === APPOINTMENT_NOT_FOUND_ERROR) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "ไม่สามารถเปลี่ยนสถานะได้" };
  }
}
