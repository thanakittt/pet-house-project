import { db } from "@/db";
import { ActionResponse } from "@/types/action";
import { TransactionCategory } from "../types/transaction-category";
import { transactionCategories } from "@/db/schema";
import { desc, isNull } from "drizzle-orm";
import { requireOwner } from "@/lib/session";

/**
 * ดึงรายการหมวดหมู่ธุรกรรมทั้งหมดที่ยังไม่ถูกลบ (soft-delete)
 * เรียงลำดับจากใหม่ไปเก่า
 */
export async function listTransactionCategories(): Promise<
  ActionResponse<TransactionCategory[]>
> {
  try {
    // ตรวจสอบ session ว่าเป็น staff หรือไม่ (ไม่ redirect อัตโนมัติ)
    const session = await requireOwner({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการดูข้อมูลหมวดหมู่ธุรกรรม",
      };
    }

    // ดึงข้อมูลหมวดหมู่ที่ยังใช้งานอยู่ เรียงจากใหม่ไปเก่า
    const data = await db
      .select({
        id: transactionCategories.id,
        name: transactionCategories.name,
        type: transactionCategories.type,
      })
      .from(transactionCategories)
      .where(isNull(transactionCategories.deletedAt))
      .orderBy(desc(transactionCategories.createdAt));

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("listTransactionCategories error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่ธุรกรรม",
    };
  }
}
