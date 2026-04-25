"use server";

import { db } from "@/db";
import {
  appointmentItems,
  healthReports,
  services,
  serviceVariants,
} from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addHealthReport(data: {
  topic: string;
  description: string;
  appointmentId: string;
  petId: string;
}) {
  try {
    const session = await requireStaff({ redirect: false });
    if (!session) {
      return {
        success: false as const,
        error: "คุณไม่มีสิทธิ์ดำเนินการ",
      };
    }

    // 1. ค้นหา ID ของบริการหลัก
    const mainServiceItems = await db
      .select({
        itemId: appointmentItems.id, // เลือกมาแค่ ID เพื่อความรวดเร็ว
      })
      .from(appointmentItems) // ตั้งต้นที่ appointmentItems ได้เลย
      .innerJoin(
        serviceVariants,
        eq(appointmentItems.serviceVariantId, serviceVariants.id),
      )
      .innerJoin(services, eq(serviceVariants.serviceId, services.id))
      .where(
        and(
          eq(appointmentItems.appointmentId, data.appointmentId),
          eq(appointmentItems.petId, data.petId),
          eq(services.serviceType, "MAIN"),
        ),
      )
      .limit(1); // สั่ง Limit 1 เพราะเราต้องการแค่อันเดียว

    // 2. ป้องกันระบบพัง กรณีหาบริการหลักไม่เจอ
    if (mainServiceItems.length === 0) {
      return {
        success: false,
        error:
          "ไม่พบรายการบริการหลัก (MAIN) สำหรับการจองนี้ ไม่สามารถบันทึกรายงานได้",
      };
    }

    // 3. บันทึกข้อมูล
    await db.insert(healthReports).values({
      topic: data.topic,
      description: data.description,
      appointmentItemId: mainServiceItems[0].itemId, // ใช้ ID ที่ได้มา
    });

    // แนะนำให้ใช้ Template Literal เพื่อให้ Revalidate ถูก Path จริงๆ
    revalidatePath(`/operations/${data.appointmentId}/${data.petId}`);

    return { success: true, data: null };
  } catch (error) {
    console.error("addHealthReport error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาด ไม่สามารถบันทึกข้อมูลได้",
    };
  }
}
