import { db } from "@/db";
import { serviceVariants, services } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { and, count, desc, eq, isNull, type SQL } from "drizzle-orm";
import { ServiceVariant } from "../types/service-variant";

export const SERVICE_VARIANT_MANAGEMENT_PAGE_SIZE = 10;

export const SERVICE_VARIANT_PET_TYPE_FILTERS = ["ALL", "DOG", "CAT"] as const;
export const SERVICE_VARIANT_SIZE_FILTERS = ["ALL", "S", "M", "L"] as const;

export type ServiceVariantPetTypeFilter =
  (typeof SERVICE_VARIANT_PET_TYPE_FILTERS)[number];
export type ServiceVariantSizeFilter =
  (typeof SERVICE_VARIANT_SIZE_FILTERS)[number];

export type GetServiceVariantsParams = {
  serviceId: string;
  page?: number;
  petType?: ServiceVariantPetTypeFilter;
  size?: ServiceVariantSizeFilter;
};

export type GetServiceVariantsResult = {
  variants: ServiceVariant[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  petType: ServiceVariantPetTypeFilter;
  size: ServiceVariantSizeFilter;
};

export function parseServiceVariantPetTypeFilter(
  value: unknown,
): ServiceVariantPetTypeFilter {
  return typeof value === "string" &&
    SERVICE_VARIANT_PET_TYPE_FILTERS.includes(
      value as ServiceVariantPetTypeFilter,
    )
    ? (value as ServiceVariantPetTypeFilter)
    : "ALL";
}

export function parseServiceVariantSizeFilter(
  value: unknown,
): ServiceVariantSizeFilter {
  return typeof value === "string" &&
    SERVICE_VARIANT_SIZE_FILTERS.includes(value as ServiceVariantSizeFilter)
    ? (value as ServiceVariantSizeFilter)
    : "ALL";
}

export function parseServiceVariantPage(value: unknown): number {
  const parsedValue =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

export async function getServiceVariants({
  serviceId,
  page = 1,
  petType = "ALL",
  size = "ALL",
}: GetServiceVariantsParams): Promise<
  ActionResponse<GetServiceVariantsResult>
> {
  try {
    const isServiceActive = await db
      .select({ id: services.id })
      .from(services)
      .where(and(eq(services.id, serviceId), isNull(services.deletedAt)))
      .limit(1);

    if (!isServiceActive.length) {
      return {
        success: false,
        error: "ไม่พบบริการหรือบริการนี้ไม่ได้เปิดใช้งาน",
      };
    }

    const filters: SQL[] = [
      eq(serviceVariants.serviceId, serviceId),
      isNull(serviceVariants.deletedAt),
    ];

    if (petType !== "ALL") {
      filters.push(eq(serviceVariants.petType, petType));
    }

    if (size !== "ALL") {
      filters.push(eq(serviceVariants.size, size));
    }

    const where = and(...filters);

    const [{ total }] = await db
      .select({ total: count() })
      .from(serviceVariants)
      .where(where);

    const totalPages = Math.ceil(total / SERVICE_VARIANT_MANAGEMENT_PAGE_SIZE);
    const currentPage =
      totalPages > 0 ? Math.min(Math.max(page, 1), totalPages) : 1;
    const offset = (currentPage - 1) * SERVICE_VARIANT_MANAGEMENT_PAGE_SIZE;

    const variants = await db
      .select({
        id: serviceVariants.id,
        minPrice: serviceVariants.minPrice,
        maxPrice: serviceVariants.maxPrice,
        petType: serviceVariants.petType,
        size: serviceVariants.size,
        isStartingPriceOnly: serviceVariants.isStartingPriceOnly,
        durationMinutes: serviceVariants.durationMinutes,
      })
      .from(serviceVariants)
      .where(where)
      .orderBy(desc(serviceVariants.createdAt))
      .limit(SERVICE_VARIANT_MANAGEMENT_PAGE_SIZE)
      .offset(offset);

    return {
      success: true,
      data: {
        variants: variants as ServiceVariant[],
        total,
        page: currentPage,
        pageSize: SERVICE_VARIANT_MANAGEMENT_PAGE_SIZE,
        totalPages,
        petType,
        size,
      },
    };
  } catch (error) {
    console.error("GetService Error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลตัวเลือกบริการ",
    };
  }
}
