"use server";

import { db } from "@/db";
import {
  ServiceVariant,
  UpdateServiceVariantForm,
} from "../types/service-variant";
import { serviceVariants } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { ActionResponse } from "@/types/action";

export async function updateServiceVariant(
  data: ServiceVariant,
): Promise<ActionResponse<null>> {
  try {
    const result = await db
      .update(serviceVariants)
      .set({
        size: data.size as "S" | "M" | "L" | "ALL",
        minPrice: data.minPrice,
        maxPrice: data.maxPrice || "0",
        isStartingPriceOnly: data.isStartingPriceOnly,
        petType: data.petType as "DOG" | "CAT",
        durationMinutes: data.durationMinutes,
      })
      .where(
        and(eq(serviceVariants.id, data.id), isNull(serviceVariants.deletedAt)),
      )
      .returning({ id: serviceVariants.id });

    if (!result[0]) {
      return {
        success: false,
        error: "ไม่พบตัวเลือกบริการที่ต้องการแก้ไข",
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("updateServiceVariant error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการแก้ไขตัวเลือกบริการ",
    };
  }
}
