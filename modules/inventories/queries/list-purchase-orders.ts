import { db } from "@/db";
import { purchaseOrderItems, purchaseOrders, staffs } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import {
  isValidPurchaseOrderStatus,
  type PurchaseOrderStatus,
} from "../constants/purchase-order-status";
import { PurchaseOrderSummary } from "../types/purchase-order";

export const PURCHASE_ORDER_MANAGEMENT_PAGE_SIZE = 10;

export type PurchaseOrderStatusFilter = "ALL" | PurchaseOrderStatus;

export type ListPurchaseOrdersParams = {
  page?: number;
  q?: string;
  status?: PurchaseOrderStatusFilter;
};

export type ListPurchaseOrdersResult = {
  orders: PurchaseOrderSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  q: string;
  status: PurchaseOrderStatusFilter;
};

export function parsePurchaseOrderPage(value: unknown): number {
  const parsedValue =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

export function parsePurchaseOrderStatusFilter(
  value: unknown,
): PurchaseOrderStatusFilter {
  if (typeof value !== "string") {
    return "ALL";
  }

  return isValidPurchaseOrderStatus(value) ? value : "ALL";
}

export async function listPurchaseOrders({
  page = 1,
  q = "",
  status = "ALL",
}: ListPurchaseOrdersParams = {}): Promise<
  ActionResponse<ListPurchaseOrdersResult>
> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการดูข้อมูลใบสั่งซื้อ",
      };
    }

    const search = q.trim();
    const filters: SQL[] = [isNull(purchaseOrders.deletedAt)];

    if (search) {
      const pattern = `%${search}%`;
      const searchFilter = or(
        ilike(staffs.nickname, pattern),
        // ค้นหาด้วยรูปแบบ DD/MM/YYYY (เช่น 27/04/2026)
        ilike(
          sql<string>`to_char(${purchaseOrders.orderDate}, 'DD/MM/YYYY')`,
          pattern,
        ),
        // ค้นหาด้วยรูปแบบ YYYY-MM-DD มาตรฐาน (เผื่อกรณีพิมพ์แบบปีขึ้นก่อน)
        ilike(
          sql<string>`to_char(${purchaseOrders.orderDate}, 'YYYY-MM-DD')`,
          pattern,
        ),
      );

      if (searchFilter) {
        filters.push(searchFilter);
      }
    }

    if (status !== "ALL") {
      filters.push(eq(purchaseOrders.status, status));
    }

    const where = and(...filters);

    const [{ total }] = await db
      .select({ total: count() })
      .from(purchaseOrders)
      .leftJoin(staffs, eq(purchaseOrders.staffId, staffs.id))
      .where(where);

    const totalPages = Math.ceil(total / PURCHASE_ORDER_MANAGEMENT_PAGE_SIZE);
    const currentPage =
      totalPages > 0 ? Math.min(Math.max(page, 1), totalPages) : 1;
    const offset = (currentPage - 1) * PURCHASE_ORDER_MANAGEMENT_PAGE_SIZE;

    const rows = await db
      .select({
        id: purchaseOrders.id,
        orderDate: purchaseOrders.orderDate,
        status: purchaseOrders.status,
        staffId: purchaseOrders.staffId,
        createdAt: purchaseOrders.createdAt,
        updatedAt: purchaseOrders.updatedAt,
        deletedAt: purchaseOrders.deletedAt,
        staffNickname: staffs.nickname,
      })
      .from(purchaseOrders)
      .leftJoin(staffs, eq(purchaseOrders.staffId, staffs.id))
      .where(where)
      .orderBy(desc(purchaseOrders.createdAt))
      .limit(PURCHASE_ORDER_MANAGEMENT_PAGE_SIZE)
      .offset(offset);

    const orderIds = rows.map((order) => order.id);
    const totalsRaw =
      orderIds.length > 0
        ? await db
            .select({
              purchaseOrderId: purchaseOrderItems.purchaseOrderId,
              totalAmount: sql<string>`COALESCE(SUM(${purchaseOrderItems.quantity}::numeric * ${purchaseOrderItems.unitCost}), 0)`,
            })
            .from(purchaseOrderItems)
            .where(
              and(
                isNull(purchaseOrderItems.deletedAt),
                inArray(purchaseOrderItems.purchaseOrderId, orderIds),
              ),
            )
            .groupBy(purchaseOrderItems.purchaseOrderId)
        : [];

    const totalsMap = new Map(
      totalsRaw.map((item) => [item.purchaseOrderId, item.totalAmount]),
    );

    const orders: PurchaseOrderSummary[] = rows.map((order) => ({
      ...order,
      staffNickname: order.staffNickname ?? "ไม่ระบุพนักงาน",
      totalAmount: totalsMap.get(order.id) ?? "0",
    }));

    return {
      success: true,
      data: {
        orders,
        total,
        page: currentPage,
        pageSize: PURCHASE_ORDER_MANAGEMENT_PAGE_SIZE,
        totalPages,
        q: search,
        status,
      },
    };
  } catch (error) {
    console.error("listPurchaseOrders error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลใบสั่งซื้อ",
    };
  }
}
