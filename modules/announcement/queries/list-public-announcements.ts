import "server-only";

import { db } from "@/db";
import { announcements } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { and, count, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { type Announcement } from "../types/announcement";

export const PUBLIC_ANNOUNCEMENT_PAGE_SIZE = 5;

export type ListPublicAnnouncementsParams = {
  page?: number;
};

export type ListPublicAnnouncementsResult = {
  announcements: Announcement[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

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

export function parsePublicAnnouncementPage(value: unknown): number {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue =
    typeof rawValue === "string"
      ? Number.parseInt(rawValue, 10)
      : Number(rawValue);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

export async function listPublicAnnouncements({
  page = 1,
}: ListPublicAnnouncementsParams = {}): Promise<
  ActionResponse<ListPublicAnnouncementsResult>
> {
  try {
    const now = new Date();
    const where = buildPublicAnnouncementWhere(now);

    const [{ total }] = await db
      .select({ total: count() })
      .from(announcements)
      .where(where);

    const totalPages = Math.ceil(total / PUBLIC_ANNOUNCEMENT_PAGE_SIZE);
    const currentPage =
      totalPages > 0 ? Math.min(Math.max(page, 1), totalPages) : 1;
    const offset = (currentPage - 1) * PUBLIC_ANNOUNCEMENT_PAGE_SIZE;

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
      .where(where)
      .orderBy(desc(announcements.startDisplayAt), desc(announcements.createdAt))
      .limit(PUBLIC_ANNOUNCEMENT_PAGE_SIZE)
      .offset(offset);

    return {
      success: true,
      data: {
        announcements: data,
        total,
        page: currentPage,
        pageSize: PUBLIC_ANNOUNCEMENT_PAGE_SIZE,
        totalPages,
      },
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
