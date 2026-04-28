"use server";

import { db } from "@/db";
import { appointments, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/session";
import { redirect } from "next/navigation";
import { recordTransaction } from "@/lib/finance/record-transaction";

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

    // 2. ดำเนินการ Database Transaction
    await db.transaction(async (tx) => {
      const existingAppointments = await tx
        .select()
        .from(appointments)
        .where(eq(appointments.id, data.appointmentId));
      if (existingAppointments.length === 0) {
        throw new Error("ไม่พบข้อมูลการจอง");
      }

      // 2.1 บันทึกข้อมูลการชำระเงินลงตาราง payments
      await tx.insert(payments).values({
        amount: data.amount.toString(),
        paymentMethod: data.paymentMethod,
        paymentDate: new Date(),
        status: "PAID", // สมมติว่าชำระสำเร็จทันที (ถ้า PromptPay อาจต้องรอ Verify Slip)
        appointmentId: data.appointmentId,
      });

      // 2.2 บันทึก transaction รายรับ (การชำระเงินเต็มจำนวน) ลงตาราง transactions
      await recordTransaction(tx, {
        amount: data.amount,
        transactionDate: new Date(),
        categoryType: "INCOME",
        categoryName: "รายรับจากการให้บริการ",
        note: `รับชำระเงินผ่าน POS (${data.paymentMethod}) นัดหมาย #${data.appointmentId}`,
      });

      // 2.3 อัปเดตสถานะ Appointment เป็น COMPLETED
      await tx
        .update(appointments)
        .set({ status: "COMPLETED" })
        .where(eq(appointments.id, data.appointmentId));
    });

    // 3. สั่ง Revalidate Cache เพื่ออัปเดต UI
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
