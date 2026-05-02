"use server";

import { db } from "@/db";
import { customers, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { requireCustomer } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import { isAPIError } from "better-auth/api";
import { and, eq, ne } from "drizzle-orm";
import { headers } from "next/headers";

type Gender = "MALE" | "FEMALE" | "UNSPECIFIED";

export type UpdateCustomerProfileInput = {
  name: string;
  phoneNumber: string;
  birthDate?: string;
  gender: Gender;
};

export type RequestCustomerEmailChangeInput = {
  newEmail: string;
};

export type ChangeCustomerPasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export type SetCustomerPasswordInput = {
  newPassword: string;
};

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PHONE_PATTERN = /^0[0-9]{9}$/;
const GENDERS: Gender[] = ["MALE", "FEMALE", "UNSPECIFIED"];

function getErrorMessage(error: unknown, fallback: string) {
  if (isAPIError(error)) {
    return error.body?.message ?? error.message ?? fallback;
  }

  return fallback;
}

async function getCurrentCustomer() {
  const session = await requireCustomer({ redirect: false });
  const userId = session?.user.id;

  if (!userId) {
    return { session: null, customer: null };
  }

  const customer = await db.query.customers.findFirst({
    columns: {
      id: true,
    },
    where: eq(customers.userId, userId),
  });

  return { session, customer };
}

export async function updateCustomerProfile(
  data: UpdateCustomerProfileInput,
): Promise<ActionResponse<null>> {
  try {
    const { session, customer } = await getCurrentCustomer();

    if (!session || !customer) {
      return { success: false, error: "ไม่พบข้อมูลโปรไฟล์" };
    }

    const name = data.name.trim();
    const phoneNumber = data.phoneNumber.trim();
    const birthDate = data.birthDate?.trim() || null;

    if (!name) {
      return { success: false, error: "กรุณาระบุชื่อ-นามสกุล" };
    }

    if (name.length > 100) {
      return {
        success: false,
        error: "ชื่อ-นามสกุลไม่เกิน 100 ตัวอักษร",
      };
    }

    if (!PHONE_PATTERN.test(phoneNumber)) {
      return {
        success: false,
        error: "เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 0 และมี 10 หลัก",
      };
    }

    if (!GENDERS.includes(data.gender)) {
      return { success: false, error: "เพศไม่ถูกต้อง" };
    }

    const [existingUserPhone] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.phoneNumber, phoneNumber), ne(users.id, session.user.id)))
      .limit(1);

    if (existingUserPhone) {
      return { success: false, error: "เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว" };
    }

    const [existingCustomerPhone] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.walkInPhoneNumber, phoneNumber),
          ne(customers.id, customer.id),
        ),
      )
      .limit(1);

    if (existingCustomerPhone) {
      return { success: false, error: "เบอร์โทรศัพท์นี้มีอยู่แล้ว" };
    }

    await auth.api.updateUser({
      body: {
        name,
        phoneNumber,
      },
      headers: await headers(),
    });

    await db
      .update(customers)
      .set({
        nickname: name,
        walkInPhoneNumber: phoneNumber,
        birthDate,
        gender: data.gender,
      })
      .where(eq(customers.id, customer.id));

    return { success: true, data: null };
  } catch (error) {
    console.error("updateCustomerProfile Error:", error);
    return {
      success: false,
      error: getErrorMessage(error, "เกิดข้อผิดพลาดในการแก้ไขข้อมูลโปรไฟล์"),
    };
  }
}

export async function requestCustomerEmailChange(
  data: RequestCustomerEmailChangeInput,
): Promise<ActionResponse<null>> {
  try {
    const session = await requireCustomer({ redirect: false });

    if (!session) {
      return { success: false, error: "ไม่พบข้อมูลผู้ใช้" };
    }

    const newEmail = data.newEmail.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(newEmail)) {
      return { success: false, error: "รูปแบบอีเมลไม่ถูกต้อง" };
    }

    await auth.api.changeEmail({
      body: {
        newEmail,
        callbackURL: "/profile",
      },
      headers: await headers(),
    });

    return { success: true, data: null };
  } catch (error) {
    console.error("requestCustomerEmailChange Error:", error);
    return {
      success: false,
      error: getErrorMessage(error, "เกิดข้อผิดพลาดในการส่งอีเมลยืนยัน"),
    };
  }
}

export async function changeCustomerPassword(
  data: ChangeCustomerPasswordInput,
): Promise<ActionResponse<null>> {
  try {
    const session = await requireCustomer({ redirect: false });

    if (!session) {
      return { success: false, error: "ไม่พบข้อมูลผู้ใช้" };
    }

    if (data.newPassword.length < 8) {
      return {
        success: false,
        error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร",
      };
    }

    await auth.api.changePassword({
      body: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });

    return { success: true, data: null };
  } catch (error) {
    console.error("changeCustomerPassword Error:", error);
    return {
      success: false,
      error: getErrorMessage(error, "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน"),
    };
  }
}

export async function setCustomerPassword(
  data: SetCustomerPasswordInput,
): Promise<ActionResponse<null>> {
  try {
    const session = await requireCustomer({ redirect: false });

    if (!session) {
      return { success: false, error: "ไม่พบข้อมูลผู้ใช้" };
    }

    if (data.newPassword.length < 8) {
      return {
        success: false,
        error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร",
      };
    }

    await auth.api.setPassword({
      body: {
        newPassword: data.newPassword,
      },
      headers: await headers(),
    });

    return { success: true, data: null };
  } catch (error) {
    console.error("setCustomerPassword Error:", error);
    return {
      success: false,
      error: getErrorMessage(error, "เกิดข้อผิดพลาดในการตั้งรหัสผ่าน"),
    };
  }
}
