"use server";

import { db } from "@/db";
import { services } from "@/db/schema";
import { Service, ServiceForm } from "../types/service";
import { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";

export async function updateService(
  data: Service,
): Promise<ActionResponse<null>> {
  try {
    const result = await db
      .update(services)
      .set({
        name: data.name,
        serviceType: data.serviceType as "MAIN" | "ADDON",
        description: data.description || null,
      })
      .where(and(eq(services.id, data.id), isNull(services.deletedAt)))
      .returning({ id: services.id });

    if (!result[0]) {
      return {
        success: false,
        error: "ไม่พบบริการที่ต้องการอัปเดต",
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("UpdateService Error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการอัปเดตบริการ",
    };
  }
}
