"use server";

import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireStaff } from "@/lib/session";
import { ActionResponse } from "@/types/action";

export interface WaitingPaymentAppointment {
  id: string;
  appointmentDate: Date;
  customer: {
    nickname: string;
    walkInPhoneNumber: string | null;
  };
  items: {
    id: string;
    price: string;
    pet: {
      name: string;
    };
    serviceVariant: {
      service: {
        name: string;
      };
    };
  }[];
}

export async function getWaitingPayments(): Promise<
  ActionResponse<WaitingPaymentAppointment[]>
> {
  try {
    // 1. Verify RBAC (เฉพาะ Staff/Admin)
    const session = await requireStaff({ redirect: false });
    if (!session) {
      return { success: false, error: "ไม่มีสิทธิ์เข้าถึงข้อมูล" };
    }

    // 2. Fetch Data from DB
    const data = await db.query.appointments.findMany({
      where: eq(appointments.status, "READY_FOR_PICKUP"), // กรองเฉพาะที่รอชำระเงิน
      orderBy: [desc(appointments.appointmentDate)], // เรียงจากวันที่ล่าสุด
      with: {
        customer: {
          columns: {
            nickname: true,
            walkInPhoneNumber: true,
          },
        },
        items: {
          with: {
            pet: {
              columns: { name: true },
            },
            serviceVariant: {
              with: {
                service: { columns: { name: true } },
              },
            },
          },
        }, 
      },
    });

    return {
      success: true,
      data: data.map((appointment) => ({
        ...appointment,
        appointmentDate: new Date(appointment.appointmentDate),
      })),
    };
  } catch (error) {
    console.error("[getWaitingPayments] Error:", error);
    return { success: false, error: "ไม่สามารถดึงข้อมูลรายการรอชำระเงินได้" };
  }
}
