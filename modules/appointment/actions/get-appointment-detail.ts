"use server";

import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AppointmentStatus } from "../types/status";
import { requireStaff } from "@/lib/session";
// import { revalidatePath } from "next/cache"; // นำกลับมาใช้ได้เมื่อมีฟังก์ชัน Update

export async function getAppointmentDetail(appointmentId: string) {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
      };
    }

    // 1. ใช้ Drizzle Relational Query ดึงข้อมูลทั้งหมดในคำสั่งเดียว
    const appointmentData = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      with: {
        customer: true, // ดึงข้อมูลลูกค้าที่เชื่อมกับนัดหมาย
        items: {
          orderBy: (items, { asc }) => [asc(items.startTime)], // เรียงลำดับเวลา
          with: {
            pet: {
              with: {
                breed: true,
              },
            }, // ดึงข้อมูลสัตว์เลี้ยง (หากมี relations ของ breed สามารถใส่ { with: { breed: true } } ได้)
            serviceVariant: {
              with: {
                service: true, // ดึงชื่อบริการหลักที่เชื่อมกับ Variant
              },
            },
          },
        },
      },
    });

    if (!appointmentData) {
      return { success: false, error: "ไม่พบข้อมูลการจองนี้" };
    }

    // 2. จัดกลุ่มรายการบริการตามสัตว์เลี้ยง (Grouping)
    const petsMap = new Map();
    let totalPrice = 0;

    appointmentData.items.forEach((item) => {
      totalPrice += Number(item.price);

      // ตรวจสอบและสร้างโครงสร้างของสัตว์เลี้ยงใน Map หากยังไม่มี
      if (!petsMap.has(item.petId)) {
        petsMap.set(item.petId, {
          petId: item.pet.id,
          petName: item.pet.name,
          petBreed: item.pet.breed.name, // หรือ item.pet.breed.type ขึ้นอยู่กับ Schema
          petType: item.pet.breed.type, // หรือ item.pet.breed.type ขึ้นอยู่กับ Schema
          services: [],
        });
      }

      // ดันข้อมูลบริการเข้าไปในสัตว์เลี้ยงตัวนั้น
      petsMap.get(item.petId).services.push({
        id: item.id,
        name: item.serviceVariant.service.name, // ชื่อบริการหลัก
        size: item.serviceVariant.size, // ไซส์/รูปแบบ
        price: Number(item.price),
        startTime: item.startTime.toISOString(),
        endTime: item.endTime.toISOString(),
      });
    });

    // 3. จัดรูปแบบข้อมูลส่งกลับไปยัง Frontend
    const formattedData = {
      id: appointmentData.id,
      date: appointmentData.appointmentDate,
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
