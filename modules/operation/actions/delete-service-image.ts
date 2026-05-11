"use server";

import { db } from "@/db";
import { appointmentItems, serviceImages } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/session";
import {
  getServiceImageStorageKeyFromUrl,
  removeServiceImagesFromStorage,
} from "../utils/service-image-storage";

export async function deleteServiceImage(
  imageId: string,
  appointmentId: string,
  petId: string,
) {
  try {
    const session = await requireStaff({ redirect: false });
    if (!session) {
      return {
        success: false as const,
        error: "คุณไม่มีสิทธิ์ดำเนินการ",
      };
    }

    // ตรวจสอบว่า role ต้องเป็น admin หรือ staff เท่านั้น (ไม่อนุญาต owner)
    const role = session.user.role;
    if (role !== "admin" && role !== "staff") {
      return {
        success: false as const,
        error: "คุณไม่มีสิทธิ์ดำเนินการ",
      };
    }

    // 1. ตรวจสอบและดึงข้อมูลจาก Database เพื่อความปลอดภัย
    const [imageRecord] = await db
      .select({
        imageUrl: serviceImages.imageUrl,
        imageStorageKey: serviceImages.imageStorageKey,
      })
      .from(serviceImages)
      .innerJoin(
        appointmentItems,
        eq(serviceImages.appointmentItemId, appointmentItems.id)
      )
      .where(
        and(
          eq(serviceImages.id, imageId),
          eq(appointmentItems.appointmentId, appointmentId),
          eq(appointmentItems.petId, petId)
        )
      )
      .limit(1);

    if (!imageRecord) {
      return { success: false, error: "ไม่พบรูปภาพหรือไม่มีสิทธิ์ลบ" };
    }

    // CODEMAP: delete storage file
    // input: storageKey ที่บันทึกใน DB สำหรับรูปใหม่ หรือ imageUrl สำหรับ row เก่า
    // processing: ใช้ key ใน DB ก่อนเพราะแม่นยำกว่า แล้วค่อย fallback ไป parse จาก public URL
    // output: ลบ object ใน Supabase ก่อนลบ row ใน database
    const storageKey =
      imageRecord.imageStorageKey ??
      getServiceImageStorageKeyFromUrl(imageRecord.imageUrl);

    if (storageKey) {
      await removeServiceImagesFromStorage([storageKey]);
    }

    // 4. ลบ Record ใน Database
    await db.delete(serviceImages).where(eq(serviceImages.id, imageId));

    // 4. Refresh UI
    revalidatePath(`/operations/${appointmentId}/${petId}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting service image:", error);
    return { success: false, error: "เกิดข้อผิดพลาด ไม่สามารถลบรูปภาพได้" };
  }
}
