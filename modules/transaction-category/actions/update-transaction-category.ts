"use server";

import { db } from "@/db";
import { TransactionCategoryForm } from "../types/transaction-category";
import { transactionCategories } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";
import { requireOwner } from "@/lib/session";

/**
 * แก้ไขข้อมูลหมวดหมู่ธุรกรรม
 * @param id - UUID ของหมวดหมู่ที่ต้องการแก้ไข
 * @param data - ข้อมูลใหม่ (name, type)
 */
export async function updateTransactionCategory({
  id,
  data,
}: {
  id: string;
  data: TransactionCategoryForm;
}): Promise<ActionResponse<null>> {
  try {
    const session = await requireOwner({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการแก้ไขข้อมูลหมวดหมู่ธุรกรรม",
      };
    }

    // ตัดช่องว่างหน้าหลังออกจากชื่อ
    const trimmedName = data.name.trim();

    if (!trimmedName) {
      return {
        success: false,
        error: "กรุณาระบุชื่อหมวดหมู่ธุรกรรม",
      };
    }

    // ตรวจสอบว่า type มีค่าถูกต้อง
    if (data.type !== "EXPENSE" && data.type !== "INCOME") {
      return {
        success: false,
        error: "ประเภทธุรกรรมไม่ถูกต้อง",
      };
    }

    // อัปเดตข้อมูลเฉพาะรายการที่ยังไม่ถูกลบ (soft-delete guard)
    const result = await db
      .update(transactionCategories)
      .set({
        name: trimmedName,
        type: data.type,
      })
      .where(
        and(
          eq(transactionCategories.id, id),
          isNull(transactionCategories.deletedAt),
        ),
      )
      .returning({ id: transactionCategories.id });

    // ถ้าไม่พบรายการ (อาจถูกลบไปแล้ว)
    if (result.length === 0) {
      return {
        success: false,
        error: "ไม่พบหมวดหมู่ธุรกรรม",
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("updateTransactionCategory error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลหมวดหมู่ธุรกรรม",
    };
  }
}
