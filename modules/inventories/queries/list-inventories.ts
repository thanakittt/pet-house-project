import { db } from "@/db";
import { inventoryCategories, inventoryItems } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import {
  and,
  count,
  desc,
  eq,
  gt,
  ilike,
  isNull,
  lte,
  sql,
  type SQL,
} from "drizzle-orm";
import { InventoryItem } from "../types/inventory";

export const INVENTORY_MANAGEMENT_PAGE_SIZE = 10;

export const INVENTORY_STATUS_FILTERS = [
  "ALL",
  "NORMAL",
  "LOW",
  "OUT",
] as const;

export type InventoryStatusFilter =
  (typeof INVENTORY_STATUS_FILTERS)[number];

export type ListInventoriesParams = {
  categoryId?: string;
  page?: number;
  q?: string;
  status?: InventoryStatusFilter;
};

export type InventoryStats = {
  total: number;
  normalStock: number;
  lowStock: number;
  outOfStock: number;
};

export type ListInventoriesResult = {
  inventories: InventoryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  q: string;
  status: InventoryStatusFilter;
  categoryId: string;
  stats: InventoryStats;
};

export function parseInventoryPage(value: unknown): number {
  const parsedValue =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

export function parseInventoryStatusFilter(
  value: unknown,
): InventoryStatusFilter {
  return typeof value === "string" &&
    INVENTORY_STATUS_FILTERS.includes(value as InventoryStatusFilter)
    ? (value as InventoryStatusFilter)
    : "ALL";
}

function getInventoryStatusFilter(status: InventoryStatusFilter): SQL | null {
  if (status === "OUT") {
    return eq(inventoryItems.quantity, 0);
  }

  if (status === "LOW") {
    return and(
      gt(inventoryItems.quantity, 0),
      lte(inventoryItems.quantity, inventoryItems.reorderLevel),
    ) ?? null;
  }

  if (status === "NORMAL") {
    return gt(inventoryItems.quantity, inventoryItems.reorderLevel);
  }

  return null;
}

export async function listInventories({
  categoryId = "ALL",
  page = 1,
  q = "",
  status = "ALL",
}: ListInventoriesParams = {}): Promise<ActionResponse<ListInventoriesResult>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการดูข้อมูลสินค้าคงคลัง",
      };
    }

    const search = q.trim();
    const normalizedCategoryId = categoryId || "ALL";
    const filters: SQL[] = [isNull(inventoryItems.deletedAt)];

    if (search) {
      filters.push(ilike(inventoryItems.name, `%${search}%`));
    }

    if (normalizedCategoryId !== "ALL") {
      filters.push(eq(inventoryItems.inventoryCategoryId, normalizedCategoryId));
    }

    const statusFilter = getInventoryStatusFilter(status);
    if (statusFilter) {
      filters.push(statusFilter);
    }

    const where = and(...filters);

    const [{ total }] = await db
      .select({ total: count() })
      .from(inventoryItems)
      .leftJoin(
        inventoryCategories,
        eq(inventoryItems.inventoryCategoryId, inventoryCategories.id),
      )
      .where(where);

    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)::int`,
        normalStock: sql<number>`COUNT(*) FILTER (WHERE ${inventoryItems.quantity} > ${inventoryItems.reorderLevel})::int`,
        lowStock: sql<number>`COUNT(*) FILTER (WHERE ${inventoryItems.quantity} > 0 AND ${inventoryItems.quantity} <= ${inventoryItems.reorderLevel})::int`,
        outOfStock: sql<number>`COUNT(*) FILTER (WHERE ${inventoryItems.quantity} = 0)::int`,
      })
      .from(inventoryItems)
      .where(isNull(inventoryItems.deletedAt));

    const totalPages = Math.ceil(total / INVENTORY_MANAGEMENT_PAGE_SIZE);
    const currentPage =
      totalPages > 0 ? Math.min(Math.max(page, 1), totalPages) : 1;
    const offset = (currentPage - 1) * INVENTORY_MANAGEMENT_PAGE_SIZE;

    const rows = await db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
        quantity: inventoryItems.quantity,
        unit: inventoryItems.unit,
        reorderLevel: inventoryItems.reorderLevel,
        inventoryCategoryId: inventoryItems.inventoryCategoryId,
        createdAt: inventoryItems.createdAt,
        updatedAt: inventoryItems.updatedAt,
        deletedAt: inventoryItems.deletedAt,
        inventoryCategoryName: inventoryCategories.name,
      })
      .from(inventoryItems)
      .leftJoin(
        inventoryCategories,
        eq(inventoryItems.inventoryCategoryId, inventoryCategories.id),
      )
      .where(where)
      .orderBy(desc(inventoryItems.createdAt))
      .limit(INVENTORY_MANAGEMENT_PAGE_SIZE)
      .offset(offset);

    const inventories: InventoryItem[] = rows.map((item) => ({
      ...item,
      inventoryCategoryName: item.inventoryCategoryName || "ไม่มีหมวดหมู่",
    }));

    return {
      success: true,
      data: {
        inventories,
        total,
        page: currentPage,
        pageSize: INVENTORY_MANAGEMENT_PAGE_SIZE,
        totalPages,
        q: search,
        status,
        categoryId: normalizedCategoryId,
        stats: stats ?? {
          total: 0,
          normalStock: 0,
          lowStock: 0,
          outOfStock: 0,
        },
      },
    };
  } catch (error) {
    console.error("listInventories error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้าคงคลัง",
    };
  }
}

export async function listAllInventories(): Promise<
  ActionResponse<InventoryItem[]>
> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการดูข้อมูลสินค้าคงคลัง",
      };
    }

    const rows = await db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
        quantity: inventoryItems.quantity,
        unit: inventoryItems.unit,
        reorderLevel: inventoryItems.reorderLevel,
        inventoryCategoryId: inventoryItems.inventoryCategoryId,
        createdAt: inventoryItems.createdAt,
        updatedAt: inventoryItems.updatedAt,
        deletedAt: inventoryItems.deletedAt,
        inventoryCategoryName: inventoryCategories.name,
      })
      .from(inventoryItems)
      .leftJoin(
        inventoryCategories,
        eq(inventoryItems.inventoryCategoryId, inventoryCategories.id),
      )
      .where(isNull(inventoryItems.deletedAt))
      .orderBy(desc(inventoryItems.createdAt));

    return {
      success: true,
      data: rows.map((item) => ({
        ...item,
        inventoryCategoryName: item.inventoryCategoryName || "ไม่มีหมวดหมู่",
      })),
    };
  } catch (error) {
    console.error("listAllInventories error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้าคงคลัง",
    };
  }
}
