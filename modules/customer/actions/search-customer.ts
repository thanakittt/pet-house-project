"use server";

import { db } from "@/db";
import { or, like } from "drizzle-orm";
import { customers } from "@/db/schema";
import { CustomerSearchResult } from "../types/customer";
import { ActionResponse } from "@/types/action";

export async function searchCustomer(
  keyword: string,
): Promise<ActionResponse<CustomerSearchResult[]>> {
  try {
    const trimmedKeyword = keyword.trim();

    if (trimmedKeyword.length < 2) {
      return { success: true, data: [] };
    }

    const customer = await db.query.customers.findMany({
      columns: {
        id: true,
        nickname: true,
      },
      where: or(
        like(customers.walkInPhoneNumber, `%${trimmedKeyword}%`),
        like(customers.nickname, `%${trimmedKeyword}%`),
      ),
      with: {
        pets: {
          columns: {
            id: true,
            name: true,
          },
          with: {
            breed: {
              columns: {
                name: true,
                type: true,
                size: true,
              },
            },
          },
        },
      },
      limit: 50,
    });

    return { success: true, data: customer };
  } catch (error) {
    console.error("searchCustomer error:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการค้นหาลูกค้า" };
  }
}
