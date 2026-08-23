"use server";

import { db } from "@/db";
import { appointments } from "@/db/schema";
import type { ActionResponse } from "@/types/action";
import { and, desc, eq, isNull } from "drizzle-orm";

export type LatestPendingDepositAppointment = {
  id: string;
  appointmentDate: string;
  createdAt: Date;
  depositAmount: number;
};

// ใช้สำหรับหน้า /appointments/new เท่านั้น:
// ตรวจว่าลูกค้าคนนี้มีคิวที่ต้องจ่ายมัดจำค้างอยู่หรือไม่
// ถ้ามีหลายคิว จะเลือกคิวล่าสุดจาก createdAt ตาม requirement รอบนี้
export async function getLatestPendingDepositAppointment(
  customerId: string,
): Promise<ActionResponse<LatestPendingDepositAppointment | null>> {
  try {
    const appointment = await db.query.appointments.findFirst({
      columns: {
        id: true,
        appointmentDate: true,
        createdAt: true,
        depositAmount: true,
      },
      where: and(
        // customerId ทำให้ลูกค้าเห็นเฉพาะคิวของตัวเอง
        eq(appointments.customerId, customerId),
        // PENDING_DEPOSIT คือสถานะหลังจองสำเร็จแต่ยังไม่ผ่านการจ่ายมัดจำ
        eq(appointments.status, "PENDING_DEPOSIT"),
        // deletedAt เป็น soft delete จึงต้องกรองคิวที่ถูกลบออกเสมอ
        isNull(appointments.deletedAt),
      ),
      // เลือกคิวที่สร้างล่าสุดเมื่อมีหลายรายการค้างชำระ
      orderBy: [desc(appointments.createdAt)],
    });

    return { success: true, data: appointment ?? null };
  } catch (error) {
    console.error("Error fetching latest pending deposit appointment:", error);
    return {
      success: false,
      error: "ไม่สามารถดึงข้อมูลคิวที่รอชำระมัดจำได้",
    };
  }
}
