"use server";

import { db } from "@/db";
import { transactions } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { requireStaff } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { TransactionForm, transactionSchema } from "../types/transaction";
import { formatDateOnly } from "@/lib/finance/date";

export async function createTransaction(
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

    const { amount, transactionDate, note, transactionCategoryId } = parsedData.data;

    await db.insert(transactions).values({
      amount: amount.toFixed(2),
      transactionDate: formatDateOnly(transactionDate),
      note: note || null,
      transactionCategoryId: transactionCategoryId,
    });

    revalidatePath("/accounting");
    return { success: true, data: null };
  } catch (error) {
    console.error("createTransaction error:", error);
    return { success: false, error: "ไม่สามารถสร้างรายการได้" };
  }
}
