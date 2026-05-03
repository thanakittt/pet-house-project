"use server";

import { db } from "@/db";
import { announcements } from "@/db/schema";
import { requireAdminAndOwner } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import {
  type AnnouncementForm,
  normalizeAnnouncementInput,
} from "../types/announcement";

export async function createAnnouncement(
  data: AnnouncementForm,
): Promise<ActionResponse<null>> {
  try {
    const session = await requireAdminAndOwner({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการสร้างประกาศ",
      };
    }

    const normalized = normalizeAnnouncementInput(data);

    if (!normalized.success) {
      return normalized;
    }

    await db.insert(announcements).values(normalized.data);

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("createAnnouncement error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการสร้างประกาศ",
    };
  }
}
