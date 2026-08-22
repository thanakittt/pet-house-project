"use server";

import { db } from "@/db";
import { serviceVariants } from "@/db/schema";
import { ServiceVariantForm } from "../types/service-variant";
import { ActionResponse } from "@/types/action";

export async function createServiceVariant(
  data: ServiceVariantForm,
): Promise<ActionResponse<null>> {
  try {

    await db.insert(serviceVariants).values({
      size: data.size as "S" | "M" | "L" | "ALL",
      minPrice: data.minPrice,
      maxPrice: data.maxPrice || "0",
      isStartingPriceOnly: data.isStartingPriceOnly === "true",
      petType: data.petType as "DOG" | "CAT",
      durationMinutes: parseInt(data.durationMinutes, 10) || 0,
      serviceId: data.serviceId,
    });

    return { success: true, data: null };
  } catch (error) {
    console.error("createServiceVariant error:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการสร้างตัวเลือกบริการ" };
  }
}
