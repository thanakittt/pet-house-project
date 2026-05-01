import { db } from "@/db";
import { petBreeds } from "@/db/schema";
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
import { PetBreed } from "../types/pet-breed";

export const PET_BREED_MANAGEMENT_PAGE_SIZE = 10;

export const PET_BREED_TYPE_FILTERS = ["ALL", "DOG", "CAT"] as const;
export const PET_BREED_SIZE_FILTERS = ["ALL", "S", "M", "L"] as const;

export type PetBreedTypeFilter = (typeof PET_BREED_TYPE_FILTERS)[number];
export type PetBreedSizeFilter = (typeof PET_BREED_SIZE_FILTERS)[number];

export type ListPetBreedsParams = {
  page?: number;
  q?: string;
  type?: PetBreedTypeFilter;
  size?: PetBreedSizeFilter;
};

export type ListPetBreedsResult = {
  petBreeds: PetBreed[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  q: string;
  type: PetBreedTypeFilter;
  size: PetBreedSizeFilter;
};

export function parsePetBreedTypeFilter(value: unknown): PetBreedTypeFilter {
  return typeof value === "string" &&
    PET_BREED_TYPE_FILTERS.includes(value as PetBreedTypeFilter)
    ? (value as PetBreedTypeFilter)
    : "ALL";
}

export function parsePetBreedSizeFilter(value: unknown): PetBreedSizeFilter {
  return typeof value === "string" &&
    PET_BREED_SIZE_FILTERS.includes(value as PetBreedSizeFilter)
    ? (value as PetBreedSizeFilter)
    : "ALL";
}

export function parsePetBreedPage(value: unknown): number {
  const parsedValue =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

export async function listPetBreeds({
  page = 1,
  q = "",
  type = "ALL",
  size = "ALL",
}: ListPetBreedsParams = {}): Promise<ActionResponse<ListPetBreedsResult>> {
  try {
    const search = q.trim();
    const filters: SQL[] = [isNull(petBreeds.deletedAt)];

    if (search) {
      filters.push(ilike(petBreeds.name, `%${search}%`));
    }

    if (type !== "ALL") {
      filters.push(eq(petBreeds.type, type));
    }

    if (size !== "ALL") {
      filters.push(eq(petBreeds.size, size));
    }

    const where = and(...filters);

    const [{ total }] = await db
      .select({ total: count() })
      .from(petBreeds)
      .where(where);

    const totalPages = Math.ceil(total / PET_BREED_MANAGEMENT_PAGE_SIZE);
    const currentPage =
      totalPages > 0 ? Math.min(Math.max(page, 1), totalPages) : 1;
    const offset = (currentPage - 1) * PET_BREED_MANAGEMENT_PAGE_SIZE;

    const breeds = await db
      .select({
        id: petBreeds.id,
        name: petBreeds.name,
        type: petBreeds.type,
        size: petBreeds.size,
      })
      .from(petBreeds)
      .where(where)
      .orderBy(desc(petBreeds.createdAt))
      .limit(PET_BREED_MANAGEMENT_PAGE_SIZE)
      .offset(offset);

    return {
      success: true,
      data: {
        petBreeds: breeds,
        total,
        page: currentPage,
        pageSize: PET_BREED_MANAGEMENT_PAGE_SIZE,
        totalPages,
        q: search,
        type,
        size,
      },
    };
  } catch (error) {
    console.error("listPetBreeds error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลสายพันธุ์สัตว์เลี้ยง",
    };
  }
}

export async function listAllPetBreeds(): Promise<ActionResponse<PetBreed[]>> {
  try {
    const breeds = await db
      .select({
        id: petBreeds.id,
        name: petBreeds.name,
        type: petBreeds.type,
        size: petBreeds.size,
      })
      .from(petBreeds)
      .where(isNull(petBreeds.deletedAt));

    return {
      success: true,
      data: breeds,
    };
  } catch (error) {
    console.error("listAllPetBreeds error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลสายพันธุ์สัตว์เลี้ยง",
    };
  }
}
