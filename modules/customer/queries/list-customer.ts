import { db } from "@/db";
import { customers, users } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  or,
  type SQL,
} from "drizzle-orm";
import { Customer } from "../types/customer";

export const CUSTOMER_MANAGEMENT_PAGE_SIZE = 10;

export const CUSTOMER_CHANNEL_FILTERS = ["ALL", "ONLINE", "WALK_IN"] as const;

export type CustomerChannelFilter =
  (typeof CUSTOMER_CHANNEL_FILTERS)[number];

export type ListCustomersParams = {
  page?: number;
  q?: string;
  channel?: CustomerChannelFilter;
};

export type ListCustomersResult = {
  customers: Customer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  q: string;
  channel: CustomerChannelFilter;
};

export function parseCustomerChannelFilter(
  value: unknown,
): CustomerChannelFilter {
  return typeof value === "string" &&
    CUSTOMER_CHANNEL_FILTERS.includes(value as CustomerChannelFilter)
    ? (value as CustomerChannelFilter)
    : "ALL";
}

export function parseCustomerPage(value: unknown): number {
  const parsedValue =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

export async function listCustomers({
  page = 1,
  q = "",
  channel = "ALL",
}: ListCustomersParams = {}): Promise<ActionResponse<ListCustomersResult>> {
  try {
    const search = q.trim();
    const filters: SQL[] = [isNull(customers.deletedAt)];

    if (search) {
      const pattern = `%${search}%`;
      const searchFilter = or(
        ilike(customers.nickname, pattern),
        ilike(customers.walkInPhoneNumber, pattern),
        ilike(users.name, pattern),
        ilike(users.phoneNumber, pattern),
      );

      if (searchFilter) {
        filters.push(searchFilter);
      }
    }

    if (channel === "ONLINE") {
      filters.push(isNotNull(customers.userId));
    }

    if (channel === "WALK_IN") {
      filters.push(isNull(customers.userId));
    }

    const where = and(...filters);

    const [{ total }] = await db
      .select({ total: count() })
      .from(customers)
      .leftJoin(users, eq(customers.userId, users.id))
      .where(where);

    const totalPages = Math.ceil(total / CUSTOMER_MANAGEMENT_PAGE_SIZE);
    const currentPage =
      totalPages > 0 ? Math.min(Math.max(page, 1), totalPages) : 1;
    const offset = (currentPage - 1) * CUSTOMER_MANAGEMENT_PAGE_SIZE;

    const result = await db
      .select({
        id: customers.id,
        nickname: customers.nickname,
        walkInPhoneNumber: customers.walkInPhoneNumber,
        userName: users.name,
        userPhoneNumber: users.phoneNumber,
        userId: customers.userId,
        createdAt: customers.createdAt,
        gender: customers.gender,
      })
      .from(customers)
      .leftJoin(users, eq(customers.userId, users.id))
      .where(where)
      .orderBy(desc(customers.createdAt))
      .limit(CUSTOMER_MANAGEMENT_PAGE_SIZE)
      .offset(offset);

    return {
      success: true,
      data: {
        customers: result,
        total,
        page: currentPage,
        pageSize: CUSTOMER_MANAGEMENT_PAGE_SIZE,
        totalPages,
        q: search,
        channel,
      },
    };
  } catch (error) {
    console.error("listCustomers Error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า",
    };
  }
}
