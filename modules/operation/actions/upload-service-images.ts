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
import {
  isAllowedServiceImageMimeType,
  isServiceImageType,
  MAX_SERVICE_IMAGE_SIZE_BYTES,
  removeServiceImagesFromStorage,
  type ServiceImageUploadResult,
  uploadServiceImageToStorage,
} from "../utils/service-image-storage";

export async function uploadServiceImages(formData: FormData) {
  const type = formData.get("type");
  const appointmentId = formData.get("appointmentId");
  const petId = formData.get("petId");
  const imageFiles = formData
    .getAll("imageFiles")
    .filter((file): file is File => file instanceof File && file.size > 0);

  const uploadedStorageKeys: string[] = [];

  try {
    const session = await requireStaff({ redirect: false });
    if (!session) {
      return {
        success: false as const,
        error: "คุณไม่มีสิทธิ์ดำเนินการ",
        uploadedStorageKeys,
      };
    }

    // CODEMAP: validate form input
    // input: FormData ดิบจาก dialog ฝั่ง client
    // processing: ตรวจ ids, type ของรูป, จำนวนไฟล์, MIME type และขนาดไฟล์ก่อน upload
    // output: ค่าที่เชื่อถือได้สำหรับใช้ต่อใน Server Action นี้
    if (typeof appointmentId !== "string" || !appointmentId) {
      return {
        success: false as const,
        error: "ไม่พบรหัสการนัดหมาย",
        uploadedStorageKeys,
      };
    }

    if (typeof petId !== "string" || !petId) {
      return {
        success: false as const,
        error: "ไม่พบรหัสสัตว์เลี้ยง",
        uploadedStorageKeys,
      };
    }

    if (typeof type !== "string" || !isServiceImageType(type)) {
      return {
        success: false as const,
        error: "ประเภทของรูปภาพไม่ถูกต้อง",
        uploadedStorageKeys,
      };
    }

    if (imageFiles.length === 0) {
      return {
        success: false as const,
        error: "กรุณาอัปโหลดอย่างน้อย 1 รูปภาพ",
        uploadedStorageKeys,
      };
    }

    for (const imageFile of imageFiles) {
      if (!isAllowedServiceImageMimeType(imageFile.type)) {
        return {
          success: false as const,
          error: "รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP",
          uploadedStorageKeys,
        };
      }

      if (imageFile.size > MAX_SERVICE_IMAGE_SIZE_BYTES) {
        return {
          success: false as const,
          error: "ขนาดรูปภาพต้องไม่เกิน 5MB",
          uploadedStorageKeys,
        };
      }
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
          eq(appointmentItems.appointmentId, appointmentId),
          eq(appointmentItems.petId, petId),
          eq(services.serviceType, "MAIN"),
        ),
      )
      .limit(1);

    if (mainServiceItems.length === 0) {
      return {
        success: false as const,
        error: "ไม่พบรายการบริการหลัก (MAIN) ไม่สามารถบันทึกรูปภาพได้",
        uploadedStorageKeys,
      };
    }

    const appointmentItemId = mainServiceItems[0].itemId;

    // CODEMAP: upload then save
    // input: ไฟล์ที่ผ่าน validation แล้ว และ appointment item ที่เป็นเจ้าของรูป
    // processing: upload ทีละไฟล์ไป Supabase Storage, เก็บ storageKey ทุกไฟล์,
    // แล้วบันทึกทั้ง imageUrl และ storageKey ลง database
    // output: row ใน database ที่ชี้กลับไปยังไฟล์ซึ่งลบได้อย่างแม่นยำภายหลัง
    const uploadedImages: ServiceImageUploadResult[] = [];

    for (const imageFile of imageFiles) {
      const uploadedImage = await uploadServiceImageToStorage({
        appointmentId,
        petId,
        type,
        imageFile,
      });

      uploadedStorageKeys.push(uploadedImage.storageKey);
      uploadedImages.push(uploadedImage);
    }

    const values = uploadedImages.map((uploadedImage) => ({
      imageUrl: uploadedImage.publicUrl,
      imageStorageKey: uploadedImage.storageKey,
      type,
      appointmentItemId: appointmentItemId,
    }));

    // 3. บันทึกลงฐานข้อมูล
    if (values.length > 0) {
      await db.insert(serviceImages).values(values);
    }

    // 4. รีเฟรชหน้า UI
    revalidatePath(`/operations/${appointmentId}/${petId}`);

    return { success: true as const, uploadedStorageKeys };
  } catch (error) {
    console.error("Error adding service images:", error);

    await removeServiceImagesFromStorage(uploadedStorageKeys);

    return {
      success: false as const,
      error: "เกิดข้อผิดพลาดในการบันทึกรูปภาพลงฐานข้อมูล",
      uploadedStorageKeys,
    };
  }
}
