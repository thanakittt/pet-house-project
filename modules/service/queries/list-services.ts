"use server";

import { db } from "@/db";
import { services } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { isNull } from "drizzle-orm";
import { Service } from "../types/service";

export async function listServices(): Promise<
  ActionResponse<Service[]>
> {
  try {
    const servicesData = await db
      .select({
        id: services.id,
        name: services.name,
        serviceType: services.serviceType,
        description: services.description,
      })
      .from(services)
      .where(isNull(services.deletedAt));

    return {
      success: true,
      data: servicesData as Service[],
    };
  } catch (error) {
    console.error("ListServices Error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลบริการ",
    };
  }
}
