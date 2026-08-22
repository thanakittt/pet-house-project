"use server";

import { ActionResponse } from "@/types/action";
import { UpdateCustomerForm } from "../types/create-customer";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { DrizzleQueryError, eq } from "drizzle-orm";
import { DatabaseError } from "pg";

export async function updateCustomer(
  data: UpdateCustomerForm,
): Promise<ActionResponse<null>> {
  try {
    await db
      .update(customers)
      .set({
        nickname: data.nickname,
        walkInPhoneNumber: data.walkInPhoneNumber,
        gender: data.gender as "MALE" | "FEMALE" | "UNSPECIFIED",
      })
      .where(eq(customers.id, data.id));

    return { success: true, data: null };
  } catch (error) {
    console.error("UpdateCustomer Error:", error);

    if (
      error instanceof DrizzleQueryError &&
      error.cause instanceof DatabaseError &&
      error.cause.code === "23505" &&
      error.cause.constraint?.includes("walk_in_phone_number")
    ) {
      return { success: false, error: "เบอร์โทรศัพท์นี้มีอยู่แล้ว" };
    }

    return { success: false, error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลลูกค้า" };
  }
}
