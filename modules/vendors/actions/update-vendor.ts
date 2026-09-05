"use server";

import { db } from "@/db";
import { vendors } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Vendor, VendorFormValues, vendorFormSchema } from "../types/vendor";

export async function updateVendor({
  id,
  data,
}: {
  id: string;
  data: VendorFormValues;
}): Promise<ActionResponse<Vendor>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการแก้ไขข้อมูลผู้จำหน่าย",
      };
    }

    if (!id) {
      return {
        success: false,
        error: "ไม่พบรหัสผู้จำหน่าย",
      };
    }

    const validation = vendorFormSchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง";
      return {
        success: false,
        error: firstError,
      };
    }

    const validData = validation.data;

    const [updated] = await db
      .update(vendors)
      .set({
        name: validData.name,
        contactName: validData.contactName || null,
        phone: validData.phone || null,
        email: validData.email || null,
        address: validData.address || null,
        taxId: validData.taxId || null,
        isActive: validData.isActive ?? true,
      })
      .where(and(eq(vendors.id, id), isNull(vendors.deletedAt)))
      .returning();

    if (!updated) {
      return {
        success: false,
        error: "ไม่พบผู้จำหน่ายที่ต้องการแก้ไข หรืออาจถูกลบไปแล้ว",
      };
    }

    revalidatePath("/back-office/vendors");

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("updateVendor error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้จำหน่าย",
    };
  }
}
