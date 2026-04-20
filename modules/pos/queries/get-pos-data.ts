"use server";

import { db } from "@/db";
import { appointments, pets, services, serviceVariants } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { and, eq, isNotNull, isNull } from "drizzle-orm";

export async function getPOSCheckoutData(appointmentId: string) {
  try {
    // 1. ตรวจสอบสิทธิ์ (RBAC: สงวนไว้สำหรับพนักงานร้านขึ้นไป)
    const session = await requireStaff({ redirect: false });
    if (!session) {
      return { success: false, error: "คุณไม่มีสิทธิ์ในการดำเนินการนี้" };
    }

    // 2. ดึงข้อมูล Appointment หลัก พร้อมรายการบริการ (Items) และข้อมูลลูกค้า
    const appointmentData = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      with: {
        customer: {
          columns: {
            nickname: true,
            walkInPhoneNumber: true,
          },
        },
        items: {
          columns: {
            id: true,
            price: true,
          },
          with: {
            pet: {
              columns: {
                id: true,
                name: true,
              },
            },
            serviceVariant: {
              columns: {
                id: true,
                size: true,
                petType: true,
              },
              with: {
                service: {
                  columns: {
                    name: true,
                    serviceType: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!appointmentData) {
      return { success: false, error: "ไม่พบข้อมูลออเดอร์หรือการจองนี้" };
    }

    // 3. ดึงข้อมูลสัตว์เลี้ยง "ทั้งหมด" ของลูกค้ารายนี้ (สำหรับ Dropdown เพิ่มรายการ)
    const availablePetsData = await db.query.pets.findMany({
      where: eq(pets.customerId, appointmentData.customerId),
      columns: {
        id: true,
        name: true,
      },
      with: {
        breed: {
          columns: {
            type: true,
          },
        },
      },
    });

    // 4. ดึงข้อมูลบริการ "ทั้งหมด" ของร้าน (สำหรับ Dropdown เพิ่มรายการ)
    const availableServices = await db.query.services.findMany({
      where: isNull(services.deletedAt),
      columns: {
        id: true,
        name: true,
        serviceType: true,
      },
      with: {
        variants: {
          columns: {
            id: true,
            size: true,
            petType: true,
            minPrice: true,
          },
          where: isNull(serviceVariants.deletedAt),
        },
      },
    });

    // 5. ส่งคืน Data Object ที่จัดรูปแบบพร้อมใช้สำหรับ Component
    return {
      success: true,
      data: {
        appointment: appointmentData,
        availablePets: availablePetsData,
        availableServices: availableServices,
      },
    };
  } catch (error) {
    console.error("Error fetching POS data:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูล POS",
    };
  }
}

// สร้าง Type Inference สำหรับนำไปใช้ในหน้า Page
export type POSCheckoutData = NonNullable<
  Awaited<ReturnType<typeof getPOSCheckoutData>>["data"]
>;
