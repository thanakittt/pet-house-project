"use server";

import { db } from "@/db";
import { appointments, customers } from "@/db/schema";
import { requireCustomer } from "@/lib/session";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const ERROR_SIGN_IN = "กรุณาเข้าสู่ระบบ";
const ERROR_APPOINTMENT_NOT_FOUND = "ไม่พบการจอง";
const ERROR_PROFILE_NOT_FOUND = "ไม่พบโปรไฟล์ลูกค้า";
const ERROR_NOT_PENDING_DEPOSIT = "ยกเลิกได้เฉพาะก่อนชำระมัดจำ";
const ERROR_CANCEL_FAILED = "ไม่สามารถยกเลิกได้ กรุณาลองใหม่อีกครั้ง";

export async function cancelCustomerAppointment(appointmentId: string): Promise<
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    }
> {
  try {
    const session = await requireCustomer({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: ERROR_SIGN_IN,
      };
    }

    if (!appointmentId) {
      return {
        success: false,
        error: ERROR_APPOINTMENT_NOT_FOUND,
      };
    }

    const customer = await db.query.customers.findFirst({
      columns: { id: true },
      where: and(
        eq(customers.userId, session.user.id),
        isNull(customers.deletedAt),
      ),
    });

    if (!customer) {
      return {
        success: false,
        error: ERROR_PROFILE_NOT_FOUND,
      };
    }

    const appointment = await db.query.appointments.findFirst({
      columns: {
        id: true,
        status: true,
      },
      where: and(
        eq(appointments.id, appointmentId),
        eq(appointments.customerId, customer.id),
        isNull(appointments.deletedAt),
      ),
    });

    if (!appointment) {
      return {
        success: false,
        error: ERROR_APPOINTMENT_NOT_FOUND,
      };
    }

    if (appointment.status !== "PENDING_DEPOSIT") {
      return {
        success: false,
        error: ERROR_NOT_PENDING_DEPOSIT,
      };
    }

    const [cancelledAppointment] = await db
      .update(appointments)
      .set({ status: "CANCELLED" })
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.customerId, customer.id),
          eq(appointments.status, "PENDING_DEPOSIT"),
          isNull(appointments.deletedAt),
        ),
      )
      .returning({ id: appointments.id });

    if (!cancelledAppointment) {
      return {
        success: false,
        error: ERROR_CANCEL_FAILED,
      };
    }

    revalidatePath("/appointments");
    revalidatePath(`/appointments/${appointmentId}`);
    revalidatePath("/appointments/new");
    revalidatePath("/back-office/appointments");
    revalidatePath(`/back-office/appointments/${appointmentId}`);

    return { success: true };
  } catch (error) {
    console.error("cancelCustomerAppointment error:", error);
    return {
      success: false,
      error: ERROR_CANCEL_FAILED,
    };
  }
}
