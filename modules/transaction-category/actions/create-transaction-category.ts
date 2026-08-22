"use server";

import { db } from "@/db";
import { TransactionCategoryForm } from "../types/transaction-category";
import { transactionCategories } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { requireOwner } from "@/lib/session";
import { revalidatePath } from "next/cache";

/**
 * สร้างหมวดหมู่ธุรกรรมใหม่
 * @param data - ข้อมูลฟอร์ม (name, type)
 */
export async function createTransactionCategory(
  data: TransactionCategoryForm,
): Promise<ActionResponse<null>> {
  try {
    const session = await requireOwner({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการสร้างหมวดหมู่ธุรกรรม",
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

    // บันทึกข้อมูลลงฐานข้อมูล
    await db.insert(transactionCategories).values({
      name: trimmedName,
      type: data.type,
    });

    revalidatePath("/transaction-categories");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("createTransactionCategory error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการสร้างหมวดหมู่ธุรกรรม",
    };
  }
}
