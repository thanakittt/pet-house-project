"use server";

import { db } from "@/db";
import { appointments, payments } from "@/db/schema"; // นำเข้า payments สำหรับใช้ desc()
import { eq, desc } from "drizzle-orm"; // นำเข้า desc
import { getSession } from "@/lib/session";
import { ActionResponse } from "@/types/action";

export interface ReceiptData {
  receiptNo: string;
  paymentDate: Date;
  paymentMethod: "CASH" | "TRANSFER";
  totalAmount: number;
  cashierName: string;
  customer: {
    nickname: string;
    phone: string | null;
  };
  items: {
    id: string;
    petId: string;
    petName: string;
    serviceName: string;
    size: string;
    price: number;
  }[];
}

export async function getReceiptData(
  appointmentId: string,
): Promise<ActionResponse<ReceiptData | null>> {
  try {
    // 1. Verify RBAC. Staff can view every receipt, but customers can only
    // view receipts for appointments that belong to their own customer profile.
    const session = await getSession();
    if (!session) {
      return { success: false, error: "ไม่มีสิทธิ์ดำเนินการ" };
    }
    // 2. Fetch Data using Drizzle ORM
    const appointmentData = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      with: {
        customer: {
          columns: { nickname: true, walkInPhoneNumber: true, userId: true },
        },
        // ปรับแก้: ดึงเฉพาะ Payment ล่าสุด 1 รายการจาก Database โดยตรง
        payments: {
          columns: {
            id: true,
            createdAt: true,
            paymentMethod: true,
            amount: true,
          },
          where: eq(payments.status, "PAID"),
          orderBy: [desc(payments.createdAt)],
          limit: 1,
        },
        items: {
          with: {
            pet: { columns: { id: true, name: true } },
            serviceVariant: {
              with: { service: { columns: { name: true } } },
            },
          },
        },
      },
    });

    if (
      !appointmentData ||
      !appointmentData.payments ||
      appointmentData.payments.length === 0
    ) {
      return { success: false, error: "ไม่พบข้อมูลการชำระเงิน" };
    }

    // เนื่องจากเรา limit: 1 มาแล้ว latestPayment จะอยู่ index 0 เสมอ
    const userRole = session.user.role;
    const isStaffUser =
      userRole === "admin" || userRole === "staff" || userRole === "owner";
    const isReceiptOwner =
      userRole === "customer" &&
      appointmentData.customer.userId === session.user.id;

    if (!isStaffUser && !isReceiptOwner) {
      return { success: false, error: "ไม่มีสิทธิ์ดูใบเสร็จนี้" };
    }

    const latestPayment = appointmentData.payments[0];

    // 3. Map Data to Interface
    return {
      success: true,
      data: {
        receiptNo: `RC-${latestPayment.id.slice(0, 8).toUpperCase()}`,
        paymentDate: latestPayment.createdAt,
        paymentMethod: latestPayment.paymentMethod,
        totalAmount: Number(latestPayment.amount),
        cashierName: isStaffUser
          ? session.user.name || "เจ้าหน้าที่ร้าน"
          : "Pet House",
        customer: {
          nickname: appointmentData.customer.nickname,
          phone: appointmentData.customer.walkInPhoneNumber,
        },
        items: appointmentData.items.map((item) => ({
          id: item.id,
          petId: item.pet.id,
          petName: item.pet.name,
          serviceName: item.serviceVariant.service.name,
          size: item.serviceVariant.size,
          price: Number(item.price),
        })),
      },
    };
  } catch (error) {
    console.error("getReceiptData Error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลใบเสร็จรับเงิน กรุณาลองใหม่อีกครั้ง",
    };
  }
}
