"use server";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { eq } from "drizzle-orm";

export async function deleteCustomer(id: string): Promise<ActionResponse<null>> {
  try {
    const deletedCustomer = await db
      .update(customers)
      .set({ deletedAt: new Date() })
      .where(eq(customers.id, id))
      .returning({ id: customers.id });

    if (!deletedCustomer[0]?.id) {
      return {
        success: false,
        error: "ไม่พบข้อมูลลูกค้าที่ต้องการลบ",
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("deleteCustomer error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการลบข้อมูลลูกค้า",
    };
  }
}
