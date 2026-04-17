"use server";

import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { AppointmentStatus } from "../types/status";

export async function updateAppointmentStatus(appointmentId: string, newStatus: AppointmentStatus) {
  try {
    await db
      .update(appointments)
      .set({ status: newStatus, updatedAt: new Date() }) // สมมติว่ามีฟิลด์ updatedAt
      .where(eq(appointments.id, appointmentId));

    // ล้างแคชหน้า Detail และหน้า Schedule เพื่อให้เห็นสถานะใหม่ทันที
    revalidatePath(`/appointments/${appointmentId}`);
    revalidatePath("/appointments");

    return { success: true };
  } catch (error) {
    console.error("Error updating status:", error);
    return { success: false, error: "ไม่สามารถเปลี่ยนสถานะได้" };
  }
}