"use server";

import { db } from "@/db";
import { customers, staffs } from "@/db/schema";
import { getSession } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import { and, eq, isNotNull } from "drizzle-orm";

const STAFF_ROLES = ["staff", "admin", "owner"] as const;

type LineConnectRole = "customer" | (typeof STAFF_ROLES)[number];

type CurrentLineUser = {
  id: string;
  role: LineConnectRole;
};

function isLineConnectRole(
  role: string | null | undefined,
): role is LineConnectRole {
  return (
    role === "customer" ||
    STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])
  );
}

async function getCurrentLineUser(): Promise<ActionResponse<CurrentLineUser>> {
  const session = await getSession();
  const userId = session?.user.id;
  const role = session?.user.role;

  if (!session) {
    return { success: false, error: "กรุณาเข้าสู่ระบบก่อน" };
  }

  if (!userId) {
    return { success: false, error: "ไม่พบไอดีผู้ใช้" };
  }

  if (!isLineConnectRole(role)) {
    return { success: false, error: "บัญชีนี้ไม่สามารถเชื่อมต่อ LINE ได้" };
  }

  return {
    success: true,
    data: {
      id: userId,
      role,
    },
  };
}

async function validateLineUserId(
  lineUserId: string,
  currentUser: CurrentLineUser,
): Promise<ActionResponse<null>> {
  const trimmedLineUserId = lineUserId.trim();

  if (!trimmedLineUserId) {
    return { success: false, error: "ไม่พบ LINE user id" };
  }

  const [existingCustomer] = await db
    .select({ userId: customers.userId })
    .from(customers)
    .where(eq(customers.lineUserId, trimmedLineUserId))
    .limit(1);

  if (
    existingCustomer?.userId &&
    existingCustomer.userId !== currentUser.id
  ) {
    return {
      success: false,
      error: "LINE account นี้ถูกเชื่อมต่อกับบัญชีอื่นแล้ว",
    };
  }

  const [existingStaff] = await db
    .select({ userId: staffs.userId })
    .from(staffs)
    .where(eq(staffs.lineUserId, trimmedLineUserId))
    .limit(1);

  if (existingStaff?.userId && existingStaff.userId !== currentUser.id) {
    return {
      success: false,
      error: "LINE account นี้ถูกเชื่อมต่อกับบัญชีอื่นแล้ว",
    };
  }

  return { success: true, data: null };
}

export async function connectLine(
  lineUserId: string,
): Promise<ActionResponse<null>> {
  try {
    const currentUserResult = await getCurrentLineUser();

    if (!currentUserResult.success) {
      return currentUserResult;
    }

    const currentUser = currentUserResult.data;
    const trimmedLineUserId = lineUserId.trim();
    const validationResult = await validateLineUserId(
      trimmedLineUserId,
      currentUser,
    );

    if (!validationResult.success) {
      return validationResult;
    }

    if (currentUser.role === "customer") {
      const result = await db
        .update(customers)
        .set({ lineUserId: trimmedLineUserId })
        .where(eq(customers.userId, currentUser.id))
        .returning({ id: customers.id });

      if (result.length === 0) {
        return { success: false, error: "ไม่พบข้อมูลลูกค้า" };
      }

      return { success: true, data: null };
    }

    const result = await db
      .update(staffs)
      .set({ lineUserId: trimmedLineUserId })
      .where(eq(staffs.userId, currentUser.id))
      .returning({ id: staffs.id });

    if (result.length === 0) {
      return { success: false, error: "ไม่พบข้อมูลพนักงาน" };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("connectLine error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE",
    };
  }
}

export async function disconnectLine(): Promise<ActionResponse<null>> {
  try {
    const currentUserResult = await getCurrentLineUser();

    if (!currentUserResult.success) {
      return currentUserResult;
    }

    const currentUser = currentUserResult.data;

    if (currentUser.role === "customer") {
      const result = await db
        .update(customers)
        .set({ lineUserId: null })
        .where(eq(customers.userId, currentUser.id))
        .returning({ id: customers.id });

      if (result.length === 0) {
        return { success: false, error: "ไม่พบข้อมูลลูกค้า" };
      }

      return { success: true, data: null };
    }

    const result = await db
      .update(staffs)
      .set({ lineUserId: null })
      .where(eq(staffs.userId, currentUser.id))
      .returning({ id: staffs.id });

    if (result.length === 0) {
      return { success: false, error: "ไม่พบข้อมูลพนักงาน" };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("disconnectLine error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการยกเลิกการเชื่อมต่อกับ LINE",
    };
  }
}

export async function isConnected(): Promise<ActionResponse<boolean>> {
  try {
    const currentUserResult = await getCurrentLineUser();

    if (!currentUserResult.success) {
      return currentUserResult;
    }

    const currentUser = currentUserResult.data;

    if (currentUser.role === "customer") {
      const result = await db
        .select({ lineUserId: customers.lineUserId })
        .from(customers)
        .where(
          and(
            eq(customers.userId, currentUser.id),
            isNotNull(customers.lineUserId),
          ),
        )
        .limit(1);

      return { success: true, data: result.length > 0 };
    }

    const result = await db
      .select({ lineUserId: staffs.lineUserId })
      .from(staffs)
      .where(
        and(
          eq(staffs.userId, currentUser.id),
          isNotNull(staffs.lineUserId),
        ),
      )
      .limit(1);

    return { success: true, data: result.length > 0 };
  } catch (error) {
    console.error("isConnected error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการตรวจสอบการเชื่อมต่อกับ LINE",
    };
  }
}
