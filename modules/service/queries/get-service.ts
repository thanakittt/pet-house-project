"use server";

import { db } from "@/db";
import { services, serviceVariants } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";
import { ServiceVariant } from "../types/service-variant";

export async function getServiceVariants({
  serviceId,
}: {
  serviceId: string;
}): Promise<ActionResponse<ServiceVariant[]>> {
  try {
    const isServiceActive = await db
      .select()
      .from(services)
      .where(and(eq(services.id, serviceId), isNull(services.deletedAt)))
      .limit(1);

    if (!isServiceActive.length) {
      return {
        success: false,
        error: "บริการนี้ไม่ได้เปิดใช้งานหรือไม่พบบริการ",
      };
    }
    const result = await db
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
      .where(
        and(
          eq(serviceVariants.serviceId, serviceId),
          isNull(serviceVariants.deletedAt),
        ),
      );

    return {
      success: true,
      data: result as ServiceVariant[] | [],
    };
  } catch (error) {
    console.error("GetService Error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลบริการ",
    };
  }
}
