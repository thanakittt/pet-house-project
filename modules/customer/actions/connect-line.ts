"use server";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { requireCustomer } from "@/lib/session";
import { and, eq, isNotNull } from "drizzle-orm";

export async function connectLine(lineUserId: string) {
  try {
    const session = await requireCustomer();

    if (!session) {
      return { success: false, error: "กรุณาเข้าสู่ระบบก่อน" };
    }

    if (!session.user.id) {
      return { success: false, error: "ไม่พบไอดีผู้ใช้" };
    }

    // Check if lineUserId already exists
    const existingCustomer = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.lineUserId, lineUserId));

    if (existingCustomer.length > 0) {
      return { success: false, error: "ผู้ใช้รายนี้ได้เชื่อมต่อกับ LINE แล้ว" };
    }

    const result = await db
      .update(customers)
      .set({
        lineUserId,
      })
      .where(eq(customers.userId, session.user.id))
      .returning({ id: customers.id });

    if (result.length === 0) {
      return { success: false, error: "ไม่พบผู้ใช้" };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("connectLine error:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE" };
  }
}

export async function disconnectLine() {
  try {
    const session = await requireCustomer();
    if (!session) {
      return { success: false, error: "กรุณาเข้าสู่ระบบก่อน" };
    }
    if (!session.user.id) {
      return { success: false, error: "ไม่พบไอดีผู้ใช้" };
    }
    const result = await db
      .update(customers)
      .set({
        lineUserId: null,
      })
      .where(eq(customers.userId, session.user.id))
      .returning({ id: customers.id });
    if (result.length === 0) {
      return { success: false, error: "ไม่พบผู้ใช้" };
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

export async function isConnected() {
  try {
    const session = await requireCustomer();
    if (!session) {
      return { success: false, error: "กรุณาเข้าสู่ระบบก่อน" };
    }
    if (!session.user.id) {
      return { success: false, error: "ไม่พบไอดีผู้ใช้" };
    }
    const result = await db
      .select({ lineUserId: customers.lineUserId })
      .from(customers)
      .where(
        and(
          eq(customers.userId, session.user.id),
          isNotNull(customers.lineUserId),
        ),
      );
    return { success: true, data: result.length > 0 };
  } catch (error) {
    console.error("isConnected error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการตรวจสอบการเชื่อมต่อกับ LINE",
    };
  }
}
