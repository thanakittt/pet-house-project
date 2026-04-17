"use server";

import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getCustomerAppointmentHistory(customerId: string) {
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
  } catch (error: any) {
    console.error("Error fetching appointment history:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch history",
    };
  }
}

// สร้าง Type Inference สำหรับนำไปใช้ใน Client Component
export type CustomerAppointmentHistory = NonNullable<
  Awaited<ReturnType<typeof getCustomerAppointmentHistory>>["data"]
>[number];
