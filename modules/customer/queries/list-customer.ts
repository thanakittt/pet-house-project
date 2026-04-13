"use server";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { isNull } from "drizzle-orm";
import { ActionResponse } from "@/types/action";
import { Customer } from "../types/customer";

export async function listCustomers(): Promise<ActionResponse<Customer[]>> {
  try {
    const result = await db
      .select({
        id: customers.id,
        nickname: customers.nickname,
        walkInPhoneNumber: customers.walkInPhoneNumber,
        userId: customers.userId,
        createdAt: customers.createdAt,
        gender: customers.gender,
      })
      .from(customers)
      .where(isNull(customers.deletedAt));

    return { success: true, data: result };
  } catch (error) {
    console.error("listCustomers Error:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า" };
  }
}
