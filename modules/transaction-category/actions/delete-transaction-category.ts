"use server";

import { db } from "@/db";
import { transactionCategories, transactions } from "@/db/schema";
import { requireOwner } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";

/**
 * ลบหมวดหมู่ธุรกรรมแบบ soft-delete (ตั้งค่า deletedAt)
 * จะไม่อนุญาตลบถ้ายังมี transactions ที่ใช้งานอยู่
 * @param id - UUID ของหมวดหมู่ที่ต้องการลบ
 */
export async function deleteTransactionCategory({
  id,
}: {
  id: string;
}): Promise<ActionResponse<null>> {
  try {
    const session = await requireOwner({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการลบหมวดหมู่ธุรกรรม",
      };
    }

    // ตรวจสอบว่ามี transaction ที่ยังใช้งานอยู่ใน category นี้หรือไม่
    const [activeTransaction] = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          eq(transactions.transactionCategoryId, id),
          isNull(transactions.deletedAt),
        ),
      )
      .limit(1);

    // ถ้ายังมี transaction ใช้งานอยู่ ไม่อนุญาตให้ลบ
    if (activeTransaction) {
      return {
        success: false,
        error: "ไม่สามารถลบหมวดหมู่ที่ยังมีธุรกรรมใช้งานอยู่",
      };
    }

    // Soft-delete: ตั้งค่า deletedAt แทนการลบจริง
    const result = await db
      .update(transactionCategories)
      .set({ deletedAt: new Date() })
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
        error: "ไม่พบหมวดหมู่ธุรกรรมที่ต้องการลบ",
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("deleteTransactionCategory error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการลบหมวดหมู่ธุรกรรม",
    };
  }
}
