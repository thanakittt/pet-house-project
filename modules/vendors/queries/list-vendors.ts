import { db } from "@/db";
import { vendors } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import { and, count, desc, eq, ilike, isNull, or, type SQL } from "drizzle-orm";
import { Vendor } from "../types/vendor";

export const VENDOR_MANAGEMENT_PAGE_SIZE = 10;

export type ListVendorsParams = {
  page?: number;
  q?: string;
  status?: "all" | "active" | "inactive";
};

export type ListVendorsResult = {
  vendors: Vendor[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  q: string;
  status: "all" | "active" | "inactive";
};

export function parseVendorPage(value: unknown): number {
  const parsedValue =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

export async function listVendors({
  page = 1,
  q = "",
  status = "all",
}: ListVendorsParams = {}): Promise<ActionResponse<ListVendorsResult>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการดูข้อมูลผู้จำหน่าย",
      };
    }

    const search = q.trim();
    const filters: SQL[] = [isNull(vendors.deletedAt)];

    if (search) {
      const searchPattern = `%${search}%`;
      filters.push(
        or(
          ilike(vendors.name, searchPattern),
          ilike(vendors.contactName, searchPattern),
          ilike(vendors.phone, searchPattern),
          ilike(vendors.taxId, searchPattern),
        )!,
      );
    }

    if (status === "active") {
      filters.push(eq(vendors.isActive, true));
    } else if (status === "inactive") {
      filters.push(eq(vendors.isActive, false));
    }

    const where = and(...filters);

    const [{ total }] = await db
      .select({ total: count() })
      .from(vendors)
      .where(where);

    const totalPages = Math.ceil(total / VENDOR_MANAGEMENT_PAGE_SIZE);
    const currentPage =
      totalPages > 0 ? Math.min(Math.max(page, 1), totalPages) : 1;
    const offset = (currentPage - 1) * VENDOR_MANAGEMENT_PAGE_SIZE;

    const vendorRows = await db
      .select()
      .from(vendors)
      .where(where)
      .orderBy(desc(vendors.createdAt))
      .limit(VENDOR_MANAGEMENT_PAGE_SIZE)
      .offset(offset);

    return {
      success: true,
      data: {
        vendors: vendorRows,
        total,
        page: currentPage,
        pageSize: VENDOR_MANAGEMENT_PAGE_SIZE,
        totalPages,
        q: search,
        status,
      },
    };
  } catch (error) {
    console.error("listVendors error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้จำหน่าย",
    };
  }
}

export async function listAllActiveVendors(): Promise<
  ActionResponse<Vendor[]>
> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการดูข้อมูลผู้จำหน่าย",
      };
    }

    const vendorRows = await db
      .select()
      .from(vendors)
      .where(and(isNull(vendors.deletedAt), eq(vendors.isActive, true)))
      .orderBy(vendors.name);

    return {
      success: true,
      data: vendorRows,
    };
  } catch (error) {
    console.error("listAllActiveVendors error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้จำหน่าย",
    };
  }
}

export async function getVendorById(
  id: string,
): Promise<ActionResponse<Vendor>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการดูข้อมูลผู้จำหน่าย",
      };
    }

    const [vendor] = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.id, id), isNull(vendors.deletedAt)))
      .limit(1);

    if (!vendor) {
      return {
        success: false,
        error: "ไม่พบข้อมูลผู้จำหน่าย",
      };
    }

    return {
      success: true,
      data: vendor,
    };
  } catch (error) {
    console.error("getVendorById error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้จำหน่าย",
    };
  }
}
