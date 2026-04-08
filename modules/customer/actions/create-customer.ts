"use server";

import { ActionResponse } from "@/types/action";
import { CustomerForm } from "../types/create-customer";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { DrizzleQueryError } from "drizzle-orm";
import { DatabaseError } from "pg";

export async function createCustomer(
  data: CustomerForm,
): Promise<ActionResponse<null>> {
  try {
    await db.insert(customers).values({
      nickname: data.nickname,
      walkInPhoneNumber: data.walkInPhoneNumber,
      gender: data.gender as "MALE" | "FEMALE" | "UNSPECIFIED",
    });

    return { success: true, data: null };
  } catch (error) {
    console.error("CreateCustomer Error:", error);

    if (
      error instanceof DrizzleQueryError &&
      error.cause instanceof DatabaseError &&
      error.cause.code === "23505" &&
      error.cause.constraint?.includes("walk_in_phone_number")
    ) {
      return { success: false, error: "เบอร์โทรศัพท์นี้มีอยู่แล้ว" };
    }

    return { success: false, error: "เกิดข้อผิดพลาดในการสร้างลูกค้า" };
  }
}
