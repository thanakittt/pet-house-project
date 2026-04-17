"use server";

import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { AppointmentStatus } from "../types/status";
import { requireStaff } from "@/lib/session";

export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: AppointmentStatus,
) {
  try {
    const session = await requireStaff({redirect: false});
    
    if (!session) {
      return { success: false, error: "คุณไม่มีสิทธิ์ในการดำเนินการนี้" };
    }

    const result = await db
      .update(appointments)
      .set({ status: newStatus, updatedAt: new Date() }) // สมมติว่ามีฟิลด์ updatedAt
      .where(eq(appointments.id, appointmentId))
      .returning({ id: appointments.id });

    if (result.length === 0) {
      return { success: false, error: "ไม่พบข้อมูลการจอง" };
    }

    // ล้างแคชหน้า Detail และหน้า Schedule เพื่อให้เห็นสถานะใหม่ทันที
    revalidatePath(`/appointments/${appointmentId}`);
    revalidatePath("/appointments");

    return { success: true };
  } catch (error) {
    console.error("Error updating status:", error);
    return { success: false, error: "ไม่สามารถเปลี่ยนสถานะได้" };
  }
}
