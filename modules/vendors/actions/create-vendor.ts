"use server";

import { db } from "@/db";
import { vendors } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import { revalidatePath } from "next/cache";
import { Vendor, VendorFormValues, vendorFormSchema } from "../types/vendor";

export async function createVendor(
  data: VendorFormValues,
): Promise<ActionResponse<Vendor>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการเพิ่มผู้จำหน่าย",
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

    const [created] = await db
      .insert(vendors)
      .values({
        name: validData.name,
        contactName: validData.contactName || null,
        phone: validData.phone || null,
        email: validData.email || null,
        address: validData.address || null,
        taxId: validData.taxId || null,
        isActive: validData.isActive ?? true,
      })
      .returning();

    revalidatePath("/back-office/vendors");

    return {
      success: true,
      data: created,
    };
  } catch (error) {
    console.error("createVendor error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการสร้างข้อมูลผู้จำหน่าย",
    };
  }
}
