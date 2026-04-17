"use server";

import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireStaff } from "@/lib/session";

export async function getCustomerAppointmentHistory(customerId: string) {
  const session = await requireStaff({ redirect: false });

  if (!session) {
    return {
      success: false,
      error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
    };
  }

  try {    
    // 2. ดึงข้อมูลประวัติการจอง พร้อม Relational Data
    const history = await db.query.appointments.findMany({
      where: eq(appointments.customerId, customerId),
      orderBy: [desc(appointments.appointmentDate)],
      with: {
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
    });

    // 3. แปลงเวลาเป็น ISO String สำหรับการส่งต่อไปยัง Client Component
    const formattedHistory = history.map((appointment) => ({
      ...appointment,
      items: appointment.items.map((item) => ({
        ...item,
        startTime: item.startTime.toISOString(),
        endTime: item.endTime.toISOString(),
      })),
    }));

    return { success: true, data: formattedHistory };
  } catch (error) {
    console.error("Error fetching appointment history:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการจอง",
    };
  }
}

// สร้าง Type Inference สำหรับนำไปใช้ใน Client Component
export type CustomerAppointmentHistory = NonNullable<
  Awaited<ReturnType<typeof getCustomerAppointmentHistory>>["data"]
>[number];
