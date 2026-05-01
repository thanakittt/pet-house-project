"use server";

import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AppointmentStatus } from "../types/status";
import { requireStaff } from "@/lib/session";

export async function getAppointmentDetail(appointmentId: string) {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
      };
    }

    // 1. Drizzle Relational Query
    const appointmentData = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      with: {
        customer: true,
        items: {
          orderBy: (items, { asc }) => [asc(items.startTime)],
          with: {
            pet: {
              with: {
                breed: true,
              },
            },
            serviceVariant: {
              with: {
                service: true,
              },
            },
            serviceImages: true,
            healthReports: {
              where: (reports, { isNull }) => isNull(reports.deletedAt),
            }, // [NEW] ดึงข้อมูลรายงานสุขภาพ
          },
        },
      },
    });

    if (!appointmentData) {
      return { success: false, error: "ไม่พบข้อมูลการจองนี้" };
    }

    // 2. จัดกลุ่มข้อมูล (Grouping)
    const petsMap = new Map();
    let totalPrice = 0;

    appointmentData.items.forEach((item) => {
      totalPrice += Number(item.price);

      if (!petsMap.has(item.petId)) {
        petsMap.set(item.petId, {
          petId: item.pet.id,
          petName: item.pet.name,
          petBreed: item.pet.breed.name,
          petType: item.pet.breed.type,
          services: [],
          serviceImages: [],
          healthReports: [], // [NEW] สร้าง Array มารองรับรายงานสุขภาพ
        });
      }

      const petData = petsMap.get(item.petId);

      petData.services.push({
        id: item.id,
        name: item.serviceVariant.service.name,
        size: item.serviceVariant.size,
        price: Number(item.price),
        startTime: item.startTime.toISOString(),
        endTime: item.endTime.toISOString(),
      });

      if (item.serviceImages && item.serviceImages.length > 0) {
        petData.serviceImages.push(...item.serviceImages);
      }

      // [NEW] ดันข้อมูลรายงานสุขภาพเข้าไป (ถ้ารายการนี้มีการบันทึกรายงาน)
      if (item.healthReports && item.healthReports.length > 0) {
        petData.healthReports.push(...item.healthReports);
      }
    });

    // 3. ส่งข้อมูลที่จัดรูปแบบแล้ว
    const formattedData = {
      id: appointmentData.id,
      date: new Date(appointmentData.appointmentDate),
      status: appointmentData.status as AppointmentStatus,
      note: appointmentData.note,
      customer: {
        id: appointmentData.customer.id,
        name: appointmentData.customer.nickname,
        walkInPhoneNumber: appointmentData.customer.walkInPhoneNumber,
      },
      totalPrice,
      pets: Array.from(petsMap.values()),
    };

    return { success: true, data: formattedData };
  } catch (error) {
    console.error("Error fetching appointment detail:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูล" };
  }
}
