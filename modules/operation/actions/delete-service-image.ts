"use server";

import { db } from "@/db";
import { serviceImages } from "@/db/schema";
import { eq } from "drizzle-orm";
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

    // 1. ดึงชื่อไฟล์ออกมาจาก URL เพื่อนำไปลบใน Storage
    // ตัวอย่าง URL: https://[project].supabase.co/storage/v1/object/public/images/12345.jpg
    const urlObj = new URL(imageUrl);
    const pathParts = urlObj.pathname.split("/");
    const fileName = pathParts[pathParts.length - 1];

    if (fileName) {
      // 2. ลบไฟล์ใน Supabase Storage
      const { error: storageError } = await supabase.storage
        .from("images") // ระบุชื่อ bucket ให้ถูกต้อง
        .remove([fileName]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
        // ถึงแม้จะลบใน Storage ไม่สำเร็จ (เช่น ไฟล์หายไปแล้ว) เราก็ควรลบใน DB ต่อไป
      }
    }

    // 3. ลบ Record ใน Database
    await db.delete(serviceImages).where(eq(serviceImages.id, imageId));

    // 4. Refresh UI
    revalidatePath(`/operations/${appointmentId}/${petId}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting service image:", error);
    return { success: false, error: "เกิดข้อผิดพลาด ไม่สามารถลบรูปภาพได้" };
  }
}
