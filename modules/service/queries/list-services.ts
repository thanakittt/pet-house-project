"use server";

import { db } from "@/db";
import { services, serviceVariants } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { isNull } from "drizzle-orm";
import { Service, ServiceWithVariants } from "../types/service";

export async function listServices(): Promise<ActionResponse<Service[]>> {
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
