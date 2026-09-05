"use server";

import { db } from "@/db";
import { vendors } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteVendor({
  id,
}: {
  id: string;
}): Promise<ActionResponse<null>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการลบผู้จำหน่าย",
      };
    }

    if (!id) {
      return {
        success: false,
        error: "ไม่พบรหัสผู้จำหน่ายที่ต้องการลบ",
      };
    }

    // ตรวจสอบว่าผู้จำหน่ายมีอยู่จริงและยังไม่ถูกลบ
    const [vendor] = await db
      .select({ id: vendors.id, name: vendors.name })
      .from(vendors)
      .where(and(eq(vendors.id, id), isNull(vendors.deletedAt)))
      .limit(1);

    if (!vendor) {
      return {
        success: false,
        error: "ไม่พบข้อมูลผู้จำหน่าย หรือผู้จำหน่ายนี้ถูกลบไปแล้ว",
      };
    }

    // Soft delete: อัปเดต deletedAt และปิดการใช้งาน isActive
    const result = await db
      .update(vendors)
      .set({
        deletedAt: new Date(),
        isActive: false,
      })
      .where(and(eq(vendors.id, id), isNull(vendors.deletedAt)))
      .returning({ id: vendors.id });

    if (result.length === 0) {
      return {
        success: false,
        error: "ไม่สามารถลบข้อมูลผู้จำหน่ายได้",
      };
    }

    revalidatePath("/back-office/vendors");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("deleteVendor error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการลบข้อมูลผู้จำหน่าย",
    };
  }
}
