"use server";

import { db } from "@/db";
import { announcements } from "@/db/schema";
import { requireAdminAndOwner } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import {
  announcementFormFromFormData,
  normalizeAnnouncementInput,
} from "../types/announcement";
import {
  getAnnouncementImageFile,
  removeAnnouncementImageByStorageKey,
  uploadAnnouncementImage,
} from "../utils/announcement-storage";

export async function createAnnouncement(
  formData: FormData,
): Promise<ActionResponse<null>> {
  let uploadedStorageKey: string | null = null;

  try {
    const session = await requireAdminAndOwner({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการสร้างประกาศ",
      };
    }

    const data = announcementFormFromFormData(formData);
    const normalized = normalizeAnnouncementInput(data);

    if (!normalized.success) {
      return normalized;
    }

    const announcementId = crypto.randomUUID();
    const imageFile = getAnnouncementImageFile(formData);
    let imageUrl: string | null = null;

    if (imageFile) {
      const uploadResult = await uploadAnnouncementImage({
        announcementId,
        imageFile,
      });

      if (!uploadResult.success) {
        return uploadResult;
      }

      imageUrl = uploadResult.publicUrl;
      uploadedStorageKey = uploadResult.storageKey;
    }

    await db.insert(announcements).values({
      id: announcementId,
      ...normalized.data,
      imageUrl,
    });

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("createAnnouncement error:", error);

    // ถ้า upload สำเร็จแล้วแต่บันทึก DB ล้มเหลว ให้ลบไฟล์ใหม่ทิ้งเพื่อไม่ให้มีไฟล์ค้างใน Storage
    await removeAnnouncementImageByStorageKey(uploadedStorageKey);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการสร้างประกาศ",
    };
  }
}
