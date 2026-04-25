"use server";

import { db } from "@/db";
import { appointmentItems, serviceImages } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase"; // ปรับ path ตามจริง
import { requireStaff } from "@/lib/session";

export async function deleteServiceImage(
  imageId: string,
  imageUrl: string,
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

    // 1. ตรวจสอบและดึงข้อมูลจาก Database เพื่อความปลอดภัย
    const [imageRecord] = await db
      .select({ imageUrl: serviceImages.imageUrl })
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

    // 2. ดึงชื่อไฟล์ออกมาจาก URL ใน DB เพื่อนำไปลบใน Storage
    const dbImageUrl = imageRecord.imageUrl;
    const urlObj = new URL(dbImageUrl);
    const pathParts = urlObj.pathname.split("/");
    const fileName = pathParts[pathParts.length - 1];

    if (fileName) {
      // 3. ลบไฟล์ใน Supabase Storage
      const { error: storageError } = await supabase.storage
        .from("images") // ระบุชื่อ bucket ให้ถูกต้อง
        .remove([fileName]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
        // ถึงแม้จะลบใน Storage ไม่สำเร็จ (เช่น ไฟล์หายไปแล้ว) เราก็ควรลบใน DB ต่อไป
      }
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
