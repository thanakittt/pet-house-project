import { db } from "@/db";
import { announcements } from "@/db/schema";
import { requireAdminAndOwner } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import {
  and,
  count,
  desc,
  eq,
  gte,
  gt,
  ilike,
  isNull,
  lt,
  lte,
  or,
  type SQL,
} from "drizzle-orm";
import {
  ANNOUNCEMENT_TYPES,
  type Announcement,
  type AnnouncementType,
} from "../types/announcement";

export const ANNOUNCEMENT_MANAGEMENT_PAGE_SIZE = 10;

export const ANNOUNCEMENT_TYPE_FILTERS = [
  "ALL",
  ...ANNOUNCEMENT_TYPES,
] as const;

export const ANNOUNCEMENT_STATUS_FILTERS = [
  "ALL",
  "ACTIVE",
  "SCHEDULED",
  "EXPIRED",
  "INACTIVE",
] as const;

export type AnnouncementTypeFilter =
  (typeof ANNOUNCEMENT_TYPE_FILTERS)[number];

export type AnnouncementStatusFilter =
  (typeof ANNOUNCEMENT_STATUS_FILTERS)[number];

export type ListAnnouncementsParams = {
  page?: number;
  q?: string;
  type?: AnnouncementTypeFilter;
  status?: AnnouncementStatusFilter;
};

export type ListAnnouncementsResult = {
  announcements: Announcement[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  q: string;
  type: AnnouncementTypeFilter;
  status: AnnouncementStatusFilter;
};

export function parseAnnouncementPage(value: unknown): number {
  const parsedValue =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

export function parseAnnouncementTypeFilter(
  value: unknown,
): AnnouncementTypeFilter {
  return typeof value === "string" &&
    ANNOUNCEMENT_TYPE_FILTERS.includes(value as AnnouncementTypeFilter)
    ? (value as AnnouncementTypeFilter)
    : "ALL";
}

export function parseAnnouncementStatusFilter(
  value: unknown,
): AnnouncementStatusFilter {
  return typeof value === "string" &&
    ANNOUNCEMENT_STATUS_FILTERS.includes(value as AnnouncementStatusFilter)
    ? (value as AnnouncementStatusFilter)
    : "ALL";
}

function buildStatusFilter(status: AnnouncementStatusFilter): SQL | null {
  const now = new Date();

  // แปลงสถานะที่ผู้ใช้เลือกเป็นเงื่อนไข SQL เพื่อให้ pagination นับจำนวนได้ถูกต้องตั้งแต่ใน DB
  switch (status) {
    case "ACTIVE":
      return and(
        eq(announcements.isActive, true),
        lte(announcements.startDisplayAt, now),
        or(
          isNull(announcements.endDisplayAt),
          gte(announcements.endDisplayAt, now),
        ),
      )!;
    case "SCHEDULED":
      return and(
        eq(announcements.isActive, true),
        gt(announcements.startDisplayAt, now),
      )!;
    case "EXPIRED":
      return and(
        eq(announcements.isActive, true),
        lt(announcements.endDisplayAt, now),
      )!;
    case "INACTIVE":
      return eq(announcements.isActive, false);
    case "ALL":
      return null;
  }
}

export async function listAnnouncements({
  page = 1,
  q = "",
  type = "ALL",
  status = "ALL",
}: ListAnnouncementsParams = {}): Promise<
  ActionResponse<ListAnnouncementsResult>
> {
  try {
    const session = await requireAdminAndOwner({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการดูข้อมูลประกาศ",
      };
    }

    const search = q.trim();
    const filters: SQL[] = [isNull(announcements.deletedAt)];

    if (search) {
      filters.push(
        or(
          ilike(announcements.title, `%${search}%`),
          ilike(announcements.content, `%${search}%`),
        )!,
      );
    }

    if (type !== "ALL") {
      filters.push(eq(announcements.type, type as AnnouncementType));
    }

    const statusFilter = buildStatusFilter(status);

    if (statusFilter) {
      filters.push(statusFilter);
    }

    const where = and(...filters);

    const [{ total }] = await db
      .select({ total: count() })
      .from(announcements)
      .where(where);

    const totalPages = Math.ceil(total / ANNOUNCEMENT_MANAGEMENT_PAGE_SIZE);
    const currentPage =
      totalPages > 0 ? Math.min(Math.max(page, 1), totalPages) : 1;
    const offset = (currentPage - 1) * ANNOUNCEMENT_MANAGEMENT_PAGE_SIZE;

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
      .orderBy(desc(announcements.createdAt))
      .limit(ANNOUNCEMENT_MANAGEMENT_PAGE_SIZE)
      .offset(offset);

    return {
      success: true,
      data: {
        announcements: data,
        total,
        page: currentPage,
        pageSize: ANNOUNCEMENT_MANAGEMENT_PAGE_SIZE,
        totalPages,
        q: search,
        type,
        status,
      },
    };
  } catch (error) {
    console.error("listAnnouncements error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลประกาศ",
    };
  }
}
