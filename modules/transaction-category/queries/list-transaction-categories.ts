import { db } from "@/db";
import { transactionCategories } from "@/db/schema";
import { requireOwner } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  isNull,
  type SQL,
} from "drizzle-orm";
import { TransactionCategory } from "../types/transaction-category";

export const TRANSACTION_CATEGORY_MANAGEMENT_PAGE_SIZE = 10;

export const TRANSACTION_CATEGORY_TYPE_FILTERS = [
  "ALL",
  "INCOME",
  "EXPENSE",
] as const;

export type TransactionCategoryTypeFilter =
  (typeof TRANSACTION_CATEGORY_TYPE_FILTERS)[number];

export type ListTransactionCategoriesParams = {
  page?: number;
  q?: string;
  type?: TransactionCategoryTypeFilter;
};

export type ListTransactionCategoriesResult = {
  transactionCategories: TransactionCategory[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  q: string;
  type: TransactionCategoryTypeFilter;
};

export function parseTransactionCategoryTypeFilter(
  value: unknown,
): TransactionCategoryTypeFilter {
  return typeof value === "string" &&
    TRANSACTION_CATEGORY_TYPE_FILTERS.includes(
      value as TransactionCategoryTypeFilter,
    )
    ? (value as TransactionCategoryTypeFilter)
    : "ALL";
}

export function parseTransactionCategoryPage(value: unknown): number {
  const parsedValue =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

export async function listTransactionCategories({
  page = 1,
  q = "",
  type = "ALL",
}: ListTransactionCategoriesParams = {}): Promise<
  ActionResponse<ListTransactionCategoriesResult>
> {
  try {
    const session = await requireOwner({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการดูข้อมูลหมวดหมู่ธุรกรรม",
      };
    }

    const search = q.trim();
    const filters: SQL[] = [isNull(transactionCategories.deletedAt)];

    if (search) {
      filters.push(ilike(transactionCategories.name, `%${search}%`));
    }

    if (type !== "ALL") {
      filters.push(eq(transactionCategories.type, type));
    }

    const where = and(...filters);

    const [{ total }] = await db
      .select({ total: count() })
      .from(transactionCategories)
      .where(where);

    const totalPages = Math.ceil(
      total / TRANSACTION_CATEGORY_MANAGEMENT_PAGE_SIZE,
    );
    const currentPage =
      totalPages > 0 ? Math.min(Math.max(page, 1), totalPages) : 1;
    const offset =
      (currentPage - 1) * TRANSACTION_CATEGORY_MANAGEMENT_PAGE_SIZE;

    const categories = await db
      .select({
        id: transactionCategories.id,
        name: transactionCategories.name,
        type: transactionCategories.type,
      })
      .from(transactionCategories)
      .where(where)
      .orderBy(desc(transactionCategories.createdAt))
      .limit(TRANSACTION_CATEGORY_MANAGEMENT_PAGE_SIZE)
      .offset(offset);

    return {
      success: true,
      data: {
        transactionCategories: categories,
        total,
        page: currentPage,
        pageSize: TRANSACTION_CATEGORY_MANAGEMENT_PAGE_SIZE,
        totalPages,
        q: search,
        type,
      },
    };
  } catch (error) {
    console.error("listTransactionCategories error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่ธุรกรรม",
    };
  }
}

export async function listAllTransactionCategories(): Promise<
  ActionResponse<TransactionCategory[]>
> {
  try {
    const session = await requireOwner({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการดูข้อมูลหมวดหมู่ธุรกรรม",
      };
    }

    const data = await db
      .select({
        id: transactionCategories.id,
        name: transactionCategories.name,
        type: transactionCategories.type,
      })
      .from(transactionCategories)
      .where(isNull(transactionCategories.deletedAt))
      .orderBy(desc(transactionCategories.createdAt));

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("listAllTransactionCategories error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่ธุรกรรม",
    };
  }
}
