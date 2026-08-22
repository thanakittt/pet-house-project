"use server";

import { db } from "@/db";
import { customers, staffs, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ActionResponse } from "@/types/action";
import { isAPIError } from "better-auth/api";
import { count, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { AuthUser, AuthUserWithProfile } from "../types/user";

export async function isPhoneNumberExists(
  phoneNumber: string,
): Promise<ActionResponse<{ exists: boolean }>> {
  try {
    const [result] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.phoneNumber, phoneNumber));

    return {
      success: true,
      data: { exists: result.count > 0 },
    };
  } catch (error) {
    console.error("isPhoneNumberExists Error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการตรวจสอบเบอร์โทรศัพท์",
    };
  }
}

export async function getUserById(
  id: string,
): Promise<ActionResponse<AuthUserWithProfile>> {
  try {
    const user = await auth.api.getUser({
      query: { id },
      headers: await headers(),
    });

    let profile:
      | {
          gender: "MALE" | "FEMALE" | "UNSPECIFIED";
          birthDate: string | null;
        }
      | undefined;

    if (
      user.role === "staff" ||
      user.role === "admin" ||
      user.role === "owner"
    ) {
      profile = await db.query.staffs.findFirst({
        columns: {
          gender: true,
          birthDate: true,
        },
        where: eq(staffs.userId, user.id),
      });
    }

    if (user.role === "customer") {
      profile = await db.query.customers.findFirst({
        columns: {
          gender: true,
          birthDate: true,
        },
        where: eq(customers.userId, user.id),
      });
    }

    return { success: true, data: { ...(user as AuthUser), ...profile } };
  } catch (error) {
    console.error("getUserById Error:", error);

    if (isAPIError(error) && error.body?.code === "USER_NOT_FOUND") {
      return {
        success: false,
        error: "ไม่พบผู้ใช้",
      };
    }

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้",
    };
  }
}
