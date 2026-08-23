"use server";

import { db } from "@/db";
import { announcements } from "@/db/schema";
import { requireAdminAndOwner } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";
import {
  announcementFormFromFormData,
  normalizeAnnouncementInput,
} from "../types/announcement";
import {
  getAnnouncementImageFile,
  getAnnouncementStorageKeyFromUrl,
  removeAnnouncementImageByStorageKey,
  shouldRemoveAnnouncementImage,
  uploadAnnouncementImage,
} from "../utils/announcement-storage";

export async function updateAnnouncement({
  id,
  formData,
}: {
  id: string;
  formData: FormData;
}): Promise<ActionResponse<null>> {
  let uploadedStorageKey: string | null = null;

  try {
    const session = await requireAdminAndOwner({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการแก้ไขประกาศ",
      };
    }

    const data = announcementFormFromFormData(formData);
    const normalized = normalizeAnnouncementInput(data);

    if (!normalized.success) {
      return normalized;
    }

    const [existingAnnouncement] = await db
      .select({ imageUrl: announcements.imageUrl })
      .from(announcements)
      .where(and(eq(announcements.id, id), isNull(announcements.deletedAt)))
      .limit(1);

    if (!existingAnnouncement) {
      return {
        success: false,
        error: "ไม่พบประกาศที่ต้องการแก้ไข",
      };
    }

    const imageFile = getAnnouncementImageFile(formData);
    const removeImage = shouldRemoveAnnouncementImage(formData);
    const shouldReplaceImage = Boolean(imageFile) || removeImage;
    let nextImageUrl = existingAnnouncement.imageUrl;

    if (imageFile) {
      const uploadResult = await uploadAnnouncementImage({
        announcementId: id,
        imageFile,
      });

      if (!uploadResult.success) {
        return uploadResult;
      }

      nextImageUrl = uploadResult.publicUrl;
      uploadedStorageKey = uploadResult.storageKey;
    } else if (removeImage) {
      nextImageUrl = null;
    }

    const result = await db
      .update(announcements)
      .set({
        ...normalized.data,
        imageUrl: nextImageUrl,
      })
      .where(and(eq(announcements.id, id), isNull(announcements.deletedAt)))
      .returning({ id: announcements.id });

    if (result.length === 0) {
      return {
        success: false,
        error: "ไม่พบประกาศที่ต้องการแก้ไข",
      };
    }

    if (shouldReplaceImage) {
      const oldStorageKey = getAnnouncementStorageKeyFromUrl(
        existingAnnouncement.imageUrl,
      );

      // DB update สำเร็จแล้วค่อยลบรูปเก่า เพื่อไม่ให้ record ชี้ไปหาไฟล์ที่ถูกลบหาก update ล้มเหลว
      await removeAnnouncementImageByStorageKey(oldStorageKey);
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("updateAnnouncement error:", error);

    // ถ้า upload รูปใหม่สำเร็จแล้วแต่ update DB ล้มเหลว ให้เก็บ DB เดิมไว้และลบรูปใหม่ออก
    await removeAnnouncementImageByStorageKey(uploadedStorageKey);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการแก้ไขประกาศ",
    };
  }
}
