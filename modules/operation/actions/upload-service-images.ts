"use server";

import { db } from "@/db";
import {
  appointmentItems,
  serviceImages,
  services,
  serviceVariants,
} from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function uploadServiceImages(data: {
  imageUrls: string[];
  type: "BEFORE" | "AFTER";
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

    // 1. ค้นหา ID ของบริการหลัก (MAIN)
    const mainServiceItems = await db
      .select({ itemId: appointmentItems.id })
      .from(appointmentItems)
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
      .limit(1);

    if (mainServiceItems.length === 0) {
      return {
        success: false,
        error: "ไม่พบรายการบริการหลัก (MAIN) ไม่สามารถบันทึกรูปภาพได้",
      };
    }

    const appointmentItemId = mainServiceItems[0].itemId;

    // 2. เตรียมข้อมูลสำหรับ Bulk Insert
    const values = data.imageUrls.map((url) => ({
      imageUrl: url,
      type: data.type,
      appointmentItemId: appointmentItemId,
    }));

    // 3. บันทึกลงฐานข้อมูล
    if (values.length > 0) {
      await db.insert(serviceImages).values(values);
    }

    // 4. รีเฟรชหน้า UI
    revalidatePath(`/operations/${data.appointmentId}/${data.petId}`);

    return { success: true };
  } catch (error) {
    console.error("Error adding service images:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการบันทึกรูปภาพลงฐานข้อมูล",
    };
  }
}
