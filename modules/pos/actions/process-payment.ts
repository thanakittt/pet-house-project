"use server";

import { db } from "@/db";
import { payments } from "@/db/schema";
import { formatDateOnly } from "@/lib/finance/date";
import { recordTransaction } from "@/lib/finance/record-transaction";
import { requireStaff } from "@/lib/session";
import {
  notifyCustomerAppointmentStatusChange,
  updateAppointmentStatusInTransaction,
} from "@/modules/appointment/actions/status-workflow";
import { revalidatePath } from "next/cache";

export interface ProcessPaymentInput {
  appointmentId: string;
  amount: number;
  paymentMethod: "CASH" | "TRANSFER";
}

export async function processPayment(data: ProcessPaymentInput) {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return { success: false, error: "ไม่มีสิทธิ์ดำเนินการ" };
    }

    if (
      !data.appointmentId ||
      typeof data.appointmentId !== "string" ||
      data.appointmentId.trim() === ""
    ) {
      return { success: false, error: "รหัสการจองไม่ถูกต้อง" };
    }

    if (
      typeof data.amount !== "number" ||
      isNaN(data.amount) ||
      data.amount <= 0
    ) {
      return { success: false, error: "จำนวนเงินไม่ถูกต้อง" };
    }

    if (
      !data.paymentMethod ||
      !["CASH", "TRANSFER"].includes(data.paymentMethod)
    ) {
      return { success: false, error: "วิธีการชำระเงินไม่ถูกต้อง" };
    }

    let statusChanged = false;

    await db.transaction(async (tx) => {
      const today = new Date();

      // อัปเดตสถานะผ่าน helper กลางตั้งแต่ใน transaction
      // ถ้า appointment ไม่ถูกต้อง helper จะ throw และ rollback ทั้งหมดทันที
      const statusResult = await updateAppointmentStatusInTransaction(
        tx,
        data.appointmentId,
        "COMPLETED",
      );
      statusChanged = statusResult.statusChanged;

      await tx.insert(payments).values({
        amount: data.amount.toString(),
        paymentMethod: data.paymentMethod,
        paymentDate: formatDateOnly(today),
        status: "PAID",
        appointmentId: data.appointmentId,
      });

      await recordTransaction(tx, {
        amount: data.amount,
        transactionDate: today,
        categoryType: "INCOME",
        categoryName: "รายรับจากการให้บริการ",
        note: `รับชำระเงินผ่าน POS (${data.paymentMethod}) นัดหมาย #${data.appointmentId}`,
      });
    });

    // ส่ง LINE หลัง transaction สำเร็จเท่านั้น และไม่ให้ LINE failure ทำให้ POS fail
    await notifyCustomerAppointmentStatusChange({
      appointmentId: data.appointmentId,
      newStatus: "COMPLETED",
      statusChanged,
    });

    revalidatePath("/pos");
    revalidatePath("/appointments");
    revalidatePath(`/appointments/${data.appointmentId}`);

    return { success: true, data: null };
  } catch (error) {
    console.error("Payment processing error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการชำระเงิน",
    };
  }
}
