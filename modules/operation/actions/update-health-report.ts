"use server";

import { db } from "@/db";
import { appointmentItems, healthReports } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateHealthReport(data: {
  id: string;
  topic: string;
  description: string;
  appointmentId: string;
  petId: string;
}) {
  try {
    const session = await requireStaff({ redirect: false });
    if (!session) {
      return {
        success: false as const,
        error: "คุณไม่มีสิทธิ์ดำเนินการ",
      };
    }

    const result = await db
      .update(healthReports)
      .set({
        topic: data.topic,
        description: data.description,
      })
      .where(
        and(
          eq(healthReports.id, data.id),
          isNull(healthReports.deletedAt),
          inArray(
            healthReports.appointmentItemId,
            db
              .select({ id: appointmentItems.id })
              .from(appointmentItems)
              .where(
                and(
                  eq(appointmentItems.appointmentId, data.appointmentId),
                  eq(appointmentItems.petId, data.petId)
                )
              )
          )
        )
      )
      .returning({ id: healthReports.id });

    if (result.length === 0) {
      return { success: false, error: "ไม่พบข้อมูลที่ต้องการแก้ไข" };
    }

    // รีเฟรชข้อมูลในหน้า Detail
    revalidatePath(`/operations/${data.appointmentId}/${data.petId}`);

    return { success: true };
  } catch (error) {
    console.error("updateHealthReport error:", error);
    return { success: false, error: "เกิดข้อผิดพลาด ไม่สามารถแก้ไขข้อมูลได้" };
  }
}
