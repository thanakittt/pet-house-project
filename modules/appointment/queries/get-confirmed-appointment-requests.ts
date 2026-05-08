"use server";

import { db } from "@/db";
import { appointments } from "@/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";

export async function getConfirmedAppointmentRequests() {
  try {
    // Input: ไม่มี filter วันที่ เพราะแท็บนี้ต้องแสดงคำขอใหม่ทุกวัน
    // Processing: ดึงเฉพาะนัดหมายที่ยืนยันมัดจำแล้ว และยังไม่ถูก soft delete
    // Output: คืนข้อมูลพร้อม customer, pet และ service สำหรับแสดงบนการ์ด
    const data = await db.query.appointments.findMany({
      where: and(
        eq(appointments.status, "CONFIRMED"),
        isNull(appointments.deletedAt),
      ),
      with: {
        customer: true,
        items: {
          with: {
            pet: true,
            serviceVariant: {
              with: {
                service: true,
              },
            },
          },
        },
      },
      orderBy: [
        desc(appointments.createdAt),
        desc(appointments.appointmentDate),
      ],
    });

    return { success: true as const, data };
  } catch (error) {
    console.error("getConfirmedAppointmentRequests error:", error);
    return {
      success: false as const,
      error: "ไม่สามารถดึงข้อมูลคำขอจองคิวใหม่ได้",
      data: [],
    };
  }
}

export type ConfirmedAppointmentRequest = Awaited<
  ReturnType<typeof getConfirmedAppointmentRequests>
>["data"][number];
