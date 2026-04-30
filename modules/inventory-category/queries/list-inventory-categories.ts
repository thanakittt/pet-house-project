import { db } from "@/db";
import { inventoryCategories } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import { and, count, desc, ilike, isNull, type SQL } from "drizzle-orm";
import { InventoryCategory } from "../types/inventory-category";

export const INVENTORY_CATEGORY_MANAGEMENT_PAGE_SIZE = 10;

export type ListInventoryCategoriesParams = {
  page?: number;
  q?: string;
};

export type ListInventoryCategoriesResult = {
  inventoryCategories: InventoryCategory[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  q: string;
};

export function parseInventoryCategoryPage(value: unknown): number {
  const parsedValue =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

export async function listInventoryCategories({
  page = 1,
  q = "",
}: ListInventoryCategoriesParams = {}): Promise<
  ActionResponse<ListInventoryCategoriesResult>
> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการดูข้อมูลหมวดหมู่สินค้า",
      };
    }

    const search = q.trim();
    const filters: SQL[] = [isNull(inventoryCategories.deletedAt)];

    if (search) {
      filters.push(ilike(inventoryCategories.name, `%${search}%`));
    }

    const where = and(...filters);

    const [{ total }] = await db
      .select({ total: count() })
      .from(inventoryCategories)
      .where(where);

    const totalPages = Math.ceil(
      total / INVENTORY_CATEGORY_MANAGEMENT_PAGE_SIZE,
    );
    const currentPage =
      totalPages > 0 ? Math.min(Math.max(page, 1), totalPages) : 1;
    const offset =
      (currentPage - 1) * INVENTORY_CATEGORY_MANAGEMENT_PAGE_SIZE;

    const categories = await db
      .select({
        id: inventoryCategories.id,
        name: inventoryCategories.name,
      })
      .from(inventoryCategories)
      .where(where)
      .orderBy(desc(inventoryCategories.createdAt))
      .limit(INVENTORY_CATEGORY_MANAGEMENT_PAGE_SIZE)
      .offset(offset);

    return {
      success: true,
      data: {
        inventoryCategories: categories,
        total,
        page: currentPage,
        pageSize: INVENTORY_CATEGORY_MANAGEMENT_PAGE_SIZE,
        totalPages,
        q: search,
      },
    };
  } catch (error) {
    console.error("listInventoryCategories error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่สินค้า",
    };
  }
}

export async function listAllInventoryCategories(): Promise<
  ActionResponse<InventoryCategory[]>
> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการดูข้อมูลหมวดหมู่สินค้า",
      };
    }

    const data = await db
      .select({
        id: inventoryCategories.id,
        name: inventoryCategories.name,
      })
      .from(inventoryCategories)
      .where(isNull(inventoryCategories.deletedAt))
      .orderBy(desc(inventoryCategories.createdAt));

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("listAllInventoryCategories error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่สินค้า",
    };
  }
}
