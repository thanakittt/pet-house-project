"use server";

import { db } from "@/db";
import { announcements } from "@/db/schema";
import { requireAdminAndOwner } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";
import {
  normalizeAnnouncementInput,
  type AnnouncementForm,
} from "../types/announcement";

export async function updateAnnouncement({
  id,
  data,
}: {
  id: string;
  data: AnnouncementForm;
}): Promise<ActionResponse<null>> {
  try {
    const session = await requireAdminAndOwner({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการแก้ไขประกาศ",
      };
    }

    const normalized = normalizeAnnouncementInput(data);

    if (!normalized.success) {
      return normalized;
    }

    const result = await db
      .update(announcements)
      .set(normalized.data)
      .where(and(eq(announcements.id, id), isNull(announcements.deletedAt)))
      .returning({ id: announcements.id });

    if (result.length === 0) {
      return {
        success: false,
        error: "ไม่พบประกาศที่ต้องการแก้ไข",
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("updateAnnouncement error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการแก้ไขประกาศ",
    };
  }
}
