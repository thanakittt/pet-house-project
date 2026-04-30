import { db } from "@/db";
import { services, serviceVariants } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  isNull,
  or,
  type SQL,
} from "drizzle-orm";
import { Service, ServiceWithVariants } from "../types/service";

export const SERVICE_MANAGEMENT_PAGE_SIZE = 10;

export const SERVICE_TYPE_FILTERS = ["ALL", "MAIN", "ADDON"] as const;

export type ServiceTypeFilter = (typeof SERVICE_TYPE_FILTERS)[number];

export type ListServicesParams = {
  page?: number;
  q?: string;
  type?: ServiceTypeFilter;
};

export type ListServicesResult = {
  services: Service[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  q: string;
  type: ServiceTypeFilter;
};

export function parseServiceTypeFilter(value: unknown): ServiceTypeFilter {
  return typeof value === "string" &&
    SERVICE_TYPE_FILTERS.includes(value as ServiceTypeFilter)
    ? (value as ServiceTypeFilter)
    : "ALL";
}

export function parseServicePage(value: unknown): number {
  const parsedValue =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

export async function listServices({
  page = 1,
  q = "",
  type = "ALL",
}: ListServicesParams = {}): Promise<ActionResponse<ListServicesResult>> {
  try {
    const search = q.trim();
    const filters: SQL[] = [isNull(services.deletedAt)];

    if (search) {
      const pattern = `%${search}%`;
      const searchFilter = or(
        ilike(services.name, pattern),
        ilike(services.description, pattern),
      );

      if (searchFilter) {
        filters.push(searchFilter);
      }
    }

    if (type !== "ALL") {
      filters.push(eq(services.serviceType, type));
    }

    const where = and(...filters);

    const [{ total }] = await db
      .select({ total: count() })
      .from(services)
      .where(where);

    const totalPages = Math.ceil(total / SERVICE_MANAGEMENT_PAGE_SIZE);
    const currentPage =
      totalPages > 0 ? Math.min(Math.max(page, 1), totalPages) : 1;
    const offset = (currentPage - 1) * SERVICE_MANAGEMENT_PAGE_SIZE;

    const servicesData = await db
      .select({
        id: services.id,
        name: services.name,
        serviceType: services.serviceType,
        description: services.description,
      })
      .from(services)
      .where(where)
      .orderBy(desc(services.createdAt))
      .limit(SERVICE_MANAGEMENT_PAGE_SIZE)
      .offset(offset);

    return {
      success: true,
      data: {
        services: servicesData as Service[],
        total,
        page: currentPage,
        pageSize: SERVICE_MANAGEMENT_PAGE_SIZE,
        totalPages,
        q: search,
        type,
      },
    };
  } catch (error) {
    console.error("ListServices Error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลบริการ",
    };
  }
}

export async function listAllServices(): Promise<ActionResponse<Service[]>> {
  try {
    const servicesData = await db
      .select({
        id: services.id,
        name: services.name,
        serviceType: services.serviceType,
        description: services.description,
      })
      .from(services)
      .where(isNull(services.deletedAt))
      .orderBy(desc(services.createdAt));

    return {
      success: true,
      data: servicesData as Service[],
    };
  } catch (error) {
    console.error("ListAllServices Error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลบริการ",
    };
  }
}

export async function listServicesWithVariants(): Promise<
  ActionResponse<ServiceWithVariants[]>
> {
  try {
    const result = await db.query.services.findMany({
      where: isNull(services.deletedAt),
      with: {
        variants: {
          where: isNull(serviceVariants.deletedAt),
        },
      },
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("listServicesWithVariants error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลบริการพร้อมตัวเลือก",
    };
  }
}
