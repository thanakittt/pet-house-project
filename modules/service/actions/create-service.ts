"use server";

import { db } from "@/db";
import { services } from "@/db/schema";
import { ServiceForm } from "../types/service";
import { ActionResponse } from "@/types/action";

export async function createService(data: ServiceForm): Promise<ActionResponse<null>> {
  try {
    await db.insert(services).values({
        name: data.name,
        serviceType: data.serviceType as "MAIN" | "ADDON",
        description: data.description || null,
    })
    
    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("CreateService Error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการสร้างบริการ",
    };
  }
}
