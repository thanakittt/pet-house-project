"use server";

import { db } from "@/db";
import { payments } from "@/db/schema";
import { APPOINTMENT_DEPOSIT_AMOUNT } from "@/lib/constants/appointment";
import { formatDateOnly } from "@/lib/finance/date";
import { recordTransaction } from "@/lib/finance/record-transaction";
import { requireStaff } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { AppointmentStatus } from "../types/status";

type DepositPaymentMethod = "CASH" | "TRANSFER";

type RecordAppointmentDepositResult =
  | {
      success: true;
      data: {
        alreadyRecorded: boolean;
        amount: number;
        paymentMethod: DepositPaymentMethod;
        paymentDate: string;
      };
    }
  | {
      success: false;
      error: string;
    };

const FINISHED_STATUSES: AppointmentStatus[] = [
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

function isDepositPaymentMethod(value: string): value is DepositPaymentMethod {
  return value === "CASH" || value === "TRANSFER";
}

export async function recordAppointmentDeposit(input: {
  appointmentId: string;
  paymentMethod: DepositPaymentMethod;
}): Promise<RecordAppointmentDepositResult> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return { success: false, error: "คุณไม่มีสิทธิ์ในการดำเนินการนี้" };
    }

    if (!input.appointmentId || input.appointmentId.trim() === "") {
      return { success: false, error: "รหัสการจองไม่ถูกต้อง" };
    }

    if (!isDepositPaymentMethod(input.paymentMethod)) {
      return { success: false, error: "วิธีชำระเงินไม่ถูกต้อง" };
    }

    const result: RecordAppointmentDepositResult = await db.transaction(
      async (tx): Promise<RecordAppointmentDepositResult> => {
        const appointment = await tx.query.appointments.findFirst({
          where: (appointmentTable, { and, eq, isNull }) =>
            and(
              eq(appointmentTable.id, input.appointmentId),
              isNull(appointmentTable.deletedAt),
            ),
          columns: {
            id: true,
            status: true,
          },
        });

        if (!appointment) {
          return { success: false, error: "ไม่พบข้อมูลการจองนี้" };
        }

        if (
          FINISHED_STATUSES.includes(appointment.status as AppointmentStatus)
        ) {
          return {
            success: false,
            error:
              "ไม่สามารถบันทึกมัดจำให้คิวที่จบงาน ยกเลิก หรือไม่มาตามนัดแล้ว",
          };
        }

        const existingDeposit = await tx.query.payments.findFirst({
          where: (paymentTable, { and, eq, isNull }) =>
            and(
              eq(paymentTable.appointmentId, input.appointmentId),
              eq(paymentTable.paymentType, "DEPOSIT"),
              eq(paymentTable.status, "PAID"),
              isNull(paymentTable.deletedAt),
            ),
          columns: {
            id: true,
            amount: true,
            paymentMethod: true,
            paymentDate: true,
          },
        });

        if (existingDeposit) {
          return {
            success: true,
            data: {
              alreadyRecorded: true,
              amount: Number(existingDeposit.amount),
              paymentMethod: existingDeposit.paymentMethod,
              paymentDate: existingDeposit.paymentDate,
            },
          };
        }

        const today = new Date();

        const [depositPayment] = await tx
          .insert(payments)
          .values({
            appointmentId: input.appointmentId,
            amount: APPOINTMENT_DEPOSIT_AMOUNT.toFixed(2),
            paymentMethod: input.paymentMethod,
            paymentDate: formatDateOnly(today),
            status: "PAID",
            paymentType: "DEPOSIT",
          })
          .returning({
            id: payments.id,
            amount: payments.amount,
            paymentMethod: payments.paymentMethod,
            paymentDate: payments.paymentDate,
          });

        await recordTransaction(tx, {
          amount: APPOINTMENT_DEPOSIT_AMOUNT,
          transactionDate: today,
          categoryType: "INCOME",
          categoryName: "รายรับมัดจำการนัดหมาย",
          note: `มัดจำนัดหมาย #${input.appointmentId}`,
        });

        return {
          success: true,
          data: {
            alreadyRecorded: false,
            amount: Number(depositPayment.amount),
            paymentMethod: depositPayment.paymentMethod,
            paymentDate: depositPayment.paymentDate,
          },
        };
      },
    );

    if (result.success) {
      revalidatePath(`/appointments/${input.appointmentId}`);
      revalidatePath("/appointments");
      revalidatePath(`/back-office/appointments/${input.appointmentId}`);
      revalidatePath("/back-office/appointments");
    }

    return result;
  } catch (error) {
    console.error("recordAppointmentDeposit error:", error);
    return { success: false, error: "ไม่สามารถบันทึกค่ามัดจำได้" };
  }
}
