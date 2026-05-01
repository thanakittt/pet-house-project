import { db } from "@/db";
import { users } from "@/db/schema";
import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import type { AuthUser } from "../types/user";

export const USER_MANAGEMENT_PAGE_SIZE = 10;

export const USER_ROLE_FILTERS = [
  "ALL",
  "admin",
  "owner",
  "staff",
  "customer",
] as const;

export type UserRoleFilter = (typeof USER_ROLE_FILTERS)[number];

export type ListUsersParams = {
  page?: number;
  q?: string;
  role?: UserRoleFilter;
};

export type ListUsersResult = {
  users: AuthUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  q: string;
  role: UserRoleFilter;
};

export function parseUserRoleFilter(value: unknown): UserRoleFilter {
  return typeof value === "string" &&
    USER_ROLE_FILTERS.includes(value as UserRoleFilter)
    ? (value as UserRoleFilter)
    : "ALL";
}

export function parseUserPage(value: unknown): number {
  const parsedValue =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

export async function listUsers({
  page = 1,
  q = "",
  role = "ALL",
}: ListUsersParams): Promise<ListUsersResult> {
  const search = q.trim();
  const filters: SQL[] = [];

  if (search) {
    const pattern = `%${search}%`;
    const searchFilter = or(
      ilike(users.name, pattern),
      ilike(users.email, pattern),
      ilike(users.phoneNumber, pattern),
    );

    if (searchFilter) {
      filters.push(searchFilter);
    }
  }

  if (role !== "ALL") {
    filters.push(eq(users.role, role));
  }

  const where = filters.length > 0 ? and(...filters) : undefined;
  const [{ total }] = await db
    .select({ total: count() })
    .from(users)
    .where(where);

  const totalPages = Math.ceil(total / USER_MANAGEMENT_PAGE_SIZE);
  const currentPage =
    totalPages > 0 ? Math.min(Math.max(page, 1), totalPages) : 1;
  const offset = (currentPage - 1) * USER_MANAGEMENT_PAGE_SIZE;

  const data = await db
    .select()
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(USER_MANAGEMENT_PAGE_SIZE)
    .offset(offset);

  return {
    users: data as AuthUser[],
    total,
    page: currentPage,
    pageSize: USER_MANAGEMENT_PAGE_SIZE,
    totalPages,
    q: search,
    role,
  };
}
