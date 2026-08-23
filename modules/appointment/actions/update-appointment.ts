"use server";

import { db } from "@/db";
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
      // อัปเดตสถานะผ่าน helper กลาง เพื่อกัน logic ซ้ำกับ flow อื่น เช่น POS
      const statusResult = await updateAppointmentStatusInTransaction(
        tx,
        appointmentId,
        newStatus,
      );
      statusChanged = statusResult.statusChanged;
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
