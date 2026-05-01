"use server";

import { db } from "@/db";
import { transactions, transactionCategories } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { requireStaff } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { TransactionForm, transactionSchema } from "../types/transaction";
import { and, eq, isNull } from "drizzle-orm";
import { isSystemCategory } from "../constants/system-categories";
import { formatDateOnly } from "@/lib/finance/date";

export async function updateTransaction(
  id: string,
  data: TransactionForm,
): Promise<ActionResponse<null>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return { success: false, error: "คุณไม่มีสิทธิ์ในการดำเนินการนี้" };
    }

    const parsedData = transactionSchema.safeParse(data);
    if (!parsedData.success) {
      return { success: false, error: "ข้อมูลไม่ถูกต้อง" };
    }

    // Check if transaction exists and is not soft-deleted
    const [existingTransaction] = await db
      .select({
        id: transactions.id,
        categoryName: transactionCategories.name,
      })
      .from(transactions)
      .innerJoin(
        transactionCategories,
        eq(transactions.transactionCategoryId, transactionCategories.id)
      )
      .where(
        and(eq(transactions.id, id), isNull(transactions.deletedAt))
      );

    if (!existingTransaction) {
      return { success: false, error: "ไม่พบข้อมูลรายการ" };
    }

    // Check if it's a system category (cannot edit)
    if (isSystemCategory(existingTransaction.categoryName)) {
      return { success: false, error: "ไม่สามารถแก้ไขรายการของระบบได้" };
    }

    const { amount, transactionDate, note, transactionCategoryId } = parsedData.data;

    await db
      .update(transactions)
      .set({
        amount: amount.toFixed(2),
        transactionDate: formatDateOnly(transactionDate),
        note: note || null,
        transactionCategoryId: transactionCategoryId,
      })
      .where(eq(transactions.id, id));

    revalidatePath("/accounting");
    return { success: true, data: null };
  } catch (error) {
    console.error("updateTransaction error:", error);
    return { success: false, error: "ไม่สามารถแก้ไขรายการได้" };
  }
}
