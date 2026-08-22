"use server";

import { db } from "@/db";
import { appointmentItems } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { eq, and } from "drizzle-orm";

export async function getPetOperationDetail(
  appointmentId: string,
  petId: string,
) {
  try {
    const session = await requireStaff({ redirect: false });
    if (!session) {
      return {
        success: false as const,
        error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลการรับบริการ",
      };
    }

    // ดึง Items ทั้งหมดของสัตว์เลี้ยงตัวนี้ ในการจองครั้งนี้
    const items = await db.query.appointmentItems.findMany({
      where: and(
        eq(appointmentItems.appointmentId, appointmentId),
        eq(appointmentItems.petId, petId),
      ),
      with: {
        appointment: {
          with: { customer: true },
        },
        pet: {
          with: { breed: true },
        },
        serviceVariant: {
          with: { service: true },
        },
        healthReports: {
          where: (reports, { isNull }) => isNull(reports.deletedAt),
          orderBy: (reports, { desc }) => [desc(reports.createdAt)],
        },
        serviceImages: {
          orderBy: (images, { desc }) => [desc(images.createdAt)],
        },
      },
    });

    if (!items || items.length === 0) {
      return { success: false, error: "ไม่พบข้อมูลการรับบริการ" };
    }

    // ยุบรวมข้อมูล (Merge) เนื่องจากมีหลาย item (เช่น อาบน้ำ, ตัดขน)
    // แต่ข้อมูลลูกค้า, สัตว์เลี้ยง และการจองหลัก จะเหมือนกันหมดในทุก item
    const mergedData = {
      appointmentId,
      petId,
      appointment: items[0].appointment,
      pet: items[0].pet,
      // รวมเวลาที่เริ่มเร็วที่สุด
      startTime: items.reduce((earliest, current) =>
        new Date(current.startTime) < new Date(earliest.startTime)
          ? current
          : earliest,
      ).startTime,
      // รวมชื่อบริการทั้งหมด
      services: items.map((item) => item.serviceVariant.service.name),
      // Map รายการ items เอาไว้ใช้อ้างอิงตอนสร้าง Health Report/Image
      itemIds: items.map((item) => item.id),
      // นำรูปภาพและรายงานมารวมกันใน Array เดียว พร้อมเรียงลำดับใหม่ล่าสุดขึ้นก่อน
      healthReports: items
        .flatMap((item) => item.healthReports)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      serviceImages: items
        .flatMap((item) => item.serviceImages)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    };

    return { success: true, data: mergedData };
  } catch (error) {
    console.error("getPetOperationDetail error:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูล" };
  }
}
