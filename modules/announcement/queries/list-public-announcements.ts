import "server-only";

import { db } from "@/db";
import { announcements } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { and, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { type Announcement } from "../types/announcement";

function buildPublicAnnouncementWhere(now: Date, id?: string) {
  const filters = [
    isNull(announcements.deletedAt),
    eq(announcements.isActive, true),
    lte(announcements.startDisplayAt, now),
    or(
      isNull(announcements.endDisplayAt),
      gte(announcements.endDisplayAt, now),
    ),
  ];

  if (id) {
    filters.push(eq(announcements.id, id));
  }

  return and(...filters);
}

export async function listPublicAnnouncements(): Promise<
  ActionResponse<Announcement[]>
> {
  try {
    const now = new Date();

    // หน้า front-store ต้องเห็นเฉพาะประกาศที่เปิดใช้งานและอยู่ในช่วงเวลาแสดงผลจริง
    const data = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        imageUrl: announcements.imageUrl,
        type: announcements.type,
        startDisplayAt: announcements.startDisplayAt,
        endDisplayAt: announcements.endDisplayAt,
        isActive: announcements.isActive,
        createdAt: announcements.createdAt,
      })
      .from(announcements)
      .where(buildPublicAnnouncementWhere(now))
      .orderBy(desc(announcements.startDisplayAt), desc(announcements.createdAt));

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("listPublicAnnouncements error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลประกาศ",
    };
  }
}

export async function getPublicAnnouncement(
  id: string,
): Promise<ActionResponse<Announcement | null>> {
  try {
    const now = new Date();

    // ใช้เงื่อนไขเดียวกับหน้า list เพื่อไม่ให้เปิด URL ตรงไปเจอประกาศที่ยังไม่ควรแสดง
    const [data] = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        imageUrl: announcements.imageUrl,
        type: announcements.type,
        startDisplayAt: announcements.startDisplayAt,
        endDisplayAt: announcements.endDisplayAt,
        isActive: announcements.isActive,
        createdAt: announcements.createdAt,
      })
      .from(announcements)
      .where(buildPublicAnnouncementWhere(now, id))
      .limit(1);

    return {
      success: true,
      data: data ?? null,
    };
  } catch (error) {
    console.error("getPublicAnnouncement error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลประกาศ",
    };
  }
}
