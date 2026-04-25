"use server";

import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq, and, gte, lt, notInArray } from "drizzle-orm";
import { startOfDay, endOfDay } from "date-fns";
import { requireStaff } from "@/lib/session";

export async function getTodayAppointmentsBoard() {
  try {
    const session = await requireStaff({ redirect: false });
    if (!session) {
      return {
        success: false as const,
        error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลตารางงานประจำวัน",
      };
    }

    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    const data = await db.query.appointments.findMany({
      where: and(
        gte(appointments.appointmentDate, start),
        lt(appointments.appointmentDate, end),
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
