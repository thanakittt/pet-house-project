"use server";

import { db } from "@/db";
import { healthReports } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { eq } from "drizzle-orm";
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
