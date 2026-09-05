"use server";

import { db } from "@/db";
import { vendors } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Vendor } from "../types/vendor";

export async function toggleVendorStatus({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}): Promise<ActionResponse<Vendor>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการเปลี่ยนสถานะผู้จำหน่าย",
      };
    }

    if (!id) {
      return {
        success: false,
        error: "ไม่พบรหัสผู้จำหน่าย",
      };
    }

    const [updated] = await db
      .update(vendors)
      .set({
        isActive,
      })
      .where(and(eq(vendors.id, id), isNull(vendors.deletedAt)))
      .returning();

    if (!updated) {
      return {
        success: false,
        error: "ไม่พบผู้จำหน่ายที่ต้องการเปลี่ยนสถานะ หรืออาจถูกลบไปแล้ว",
      };
    }

    revalidatePath("/back-office/vendors");

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("toggleVendorStatus error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะผู้จำหน่าย",
    };
  }
}
