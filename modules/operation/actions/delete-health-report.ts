"use server";

import { db } from "@/db";
import { appointmentItems, healthReports } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteHealthReport(
  id: string,
  appointmentId: string,
  petId: string,
) {
  try {
    const session = await requireStaff({ redirect: false });
    if (!session) {
      return {
        success: false as const,
        error: "คุณไม่มีสิทธิ์ดำเนินการ",
      };
    }

    // ตรวจสอบความเชื่อมโยง: healthReport.id ต้องเชื่อมโยงกับ appointmentItem ที่ตรงกับ appointmentId และ petId
    // เพื่อป้องกัน request ที่รู้แค่ reportId ไม่ให้ลบ report จากนัดหมาย/สัตว์เลี้ยงอื่น (mirror การ validate ใน delete-service-image)
    const [reportRecord] = await db
      .select({ id: healthReports.id })
      .from(healthReports)
      .innerJoin(
        appointmentItems,
        eq(healthReports.appointmentItemId, appointmentItems.id),
      )
      .where(
        and(
          eq(healthReports.id, id),
          eq(appointmentItems.appointmentId, appointmentId),
          eq(appointmentItems.petId, petId),
        ),
      )
      .limit(1);

    if (!reportRecord) {
      return {
        success: false as const,
        error: "ไม่พบรายงานหรือไม่มีสิทธิ์ลบ",
      };
    }

    const result = await db
      .update(healthReports)
      .set({ deletedAt: new Date() })
      .where(eq(healthReports.id, id))
      .returning({ id: healthReports.id });

    if (result.length === 0) {
      return { success: false, error: "ไม่พบข้อมูลที่ต้องการลบ" };
    }

    // รีเฟรชข้อมูลในหน้า Detail หลังจากลบเสร็จ
    revalidatePath(`/operations/${appointmentId}/${petId}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting health report:", error);
    return { success: false, error: "เกิดข้อผิดพลาด ไม่สามารถลบข้อมูลได้" };
  }
}
