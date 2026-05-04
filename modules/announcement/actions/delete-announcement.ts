"use server";

import { db } from "@/db";
import { announcements } from "@/db/schema";
import { requireAdminAndOwner } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";

export async function deleteAnnouncement({
  id,
}: {
  id: string;
}): Promise<ActionResponse<null>> {
  try {
    const session = await requireAdminAndOwner({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการลบประกาศ",
      };
    }

    // Soft delete: ตั้ง deletedAt แทนการลบจริง เพื่อยังเก็บประวัติประกาศไว้ในฐานข้อมูล
    const result = await db
      .update(announcements)
      .set({ deletedAt: new Date() })
      .where(and(eq(announcements.id, id), isNull(announcements.deletedAt)))
      .returning({ id: announcements.id });

    if (result.length === 0) {
      return {
        success: false,
        error: "ไม่พบประกาศที่ต้องการลบ",
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("deleteAnnouncement error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการลบประกาศ",
    };
  }
}
