"use server";

import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq, and, notInArray } from "drizzle-orm";
import { requireStaff } from "@/lib/session";
import { formatDateOnly } from "@/lib/finance/date";

export async function getTodayAppointmentsBoard() {
  try {
    const session = await requireStaff({ redirect: false });
    if (!session) {
      return {
        success: false as const,
        error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลตารางงานประจำวัน",
      };
    }

    const today = formatDateOnly(new Date());

    const data = await db.query.appointments.findMany({
      where: and(
        eq(appointments.appointmentDate, today),
        // ตัดสถานะที่ไม่ใช่ Operation ของวันนี้ออกไป
        notInArray(appointments.status, [
          "CANCELLED",
          "NO_SHOW",
          "PENDING_DEPOSIT",
          "PENDING_APPROVAL",
        ]),
      ),
      with: {
        customer: true,
        items: {
          with: {
            pet: { with: { breed: true } },
            serviceVariant: { with: { service: true } },
          },
        },
      },
      orderBy: (appointments, { asc }) => [asc(appointments.appointmentDate)],
    });

    return { success: true as const, data };
  } catch (error) {
    console.error("getTodayAppointmentsBoard error:", error);
    return {
      success: false as const,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลตารางงานประจำวัน",
      data: null,
    };
  }
}

export type TodayAppointmentsResult = NonNullable<
  Awaited<ReturnType<typeof getTodayAppointmentsBoard>>["data"]
>;
