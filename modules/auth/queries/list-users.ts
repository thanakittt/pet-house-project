import { db } from "@/db";
import { accounts, customers, staffs, users } from "@/db/schema";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  type SQL,
} from "drizzle-orm";
import type { AuthSignupProvider, AuthUser } from "../types/user";

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

function toSignupProvider(providerId: string | undefined): AuthSignupProvider {
  if (providerId === "credential") return "email";
  if (providerId === "google") return "google";
  if (providerId === "line") return "line";
  return "unknown";
}

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

  const userIds = data.map((user) => user.id);

  if (userIds.length === 0) {
    return {
      users: [],
      total,
      page: currentPage,
      pageSize: USER_MANAGEMENT_PAGE_SIZE,
      totalPages,
      q: search,
      role,
    };
  }

  const [customerLineConnections, staffLineConnections, userAccounts] =
    await Promise.all([
      db
        .select({
          userId: customers.userId,
          lineUserId: customers.lineUserId,
        })
        .from(customers)
        .where(inArray(customers.userId, userIds)),
      db
        .select({
          userId: staffs.userId,
          lineUserId: staffs.lineUserId,
        })
        .from(staffs)
        .where(inArray(staffs.userId, userIds)),
      db
        .select({
          userId: accounts.userId,
          providerId: accounts.providerId,
        })
        .from(accounts)
        .where(inArray(accounts.userId, userIds))
        .orderBy(asc(accounts.createdAt)),
    ]);

  const lineConnectionByUserId = new Map<string, boolean>();

  customerLineConnections.forEach((customer) => {
    if (customer.userId) {
      lineConnectionByUserId.set(customer.userId, Boolean(customer.lineUserId));
    }
  });

  staffLineConnections.forEach((staff) => {
    lineConnectionByUserId.set(staff.userId, Boolean(staff.lineUserId));
  });

  const signupProviderByUserId = new Map<string, AuthSignupProvider>();

  userAccounts.forEach((account) => {
    if (!signupProviderByUserId.has(account.userId)) {
      signupProviderByUserId.set(
        account.userId,
        toSignupProvider(account.providerId),
      );
    }
  });

  const enrichedUsers = data.map((user) => ({
    ...user,
    hasLineConnection: lineConnectionByUserId.get(user.id) ?? false,
    signupProvider: signupProviderByUserId.get(user.id) ?? "unknown",
  }));

  return {
    users: enrichedUsers as AuthUser[],
    total,
    page: currentPage,
    pageSize: USER_MANAGEMENT_PAGE_SIZE,
    totalPages,
    q: search,
    role,
  };
}
