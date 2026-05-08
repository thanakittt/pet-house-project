"use server";

import { db } from "@/db";
import { staffs, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { requireStaff } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import { isAPIError } from "better-auth/api";
import { and, eq, ne } from "drizzle-orm";
import { headers } from "next/headers";

type Gender = "MALE" | "FEMALE" | "UNSPECIFIED";

export type UpdateStaffProfileInput = {
  name: string;
  phoneNumber: string;
  birthDate?: string;
  gender: Gender;
};

export type RequestStaffEmailChangeInput = {
  newEmail: string;
};

export type ChangeStaffPasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export type SetStaffPasswordInput = {
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

function isFutureDate(value: string) {
  const inputDate = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Number.isNaN(inputDate.getTime()) || inputDate > today;
}

async function getCurrentStaffSession() {
  const session = await requireStaff({ redirect: false });
  const userId = session?.user.id;

  if (!userId) {
    return null;
  }

  return session;
}

export async function updateStaffProfile(
  data: UpdateStaffProfileInput,
): Promise<ActionResponse<null>> {
  try {
    const session = await getCurrentStaffSession();

    if (!session) {
      return { success: false, error: "ไม่พบข้อมูลโปรไฟล์พนักงาน" };
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

    if (birthDate && isFutureDate(birthDate)) {
      return { success: false, error: "วันเกิดต้องไม่เกินวันที่ปัจจุบัน" };
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

    const previousStaff = await db.query.staffs.findFirst({
      columns: {
        nickname: true,
        birthDate: true,
        gender: true,
      },
      where: eq(staffs.userId, session.user.id),
    });

    await db
      .insert(staffs)
      .values({
        userId: session.user.id,
        nickname: name,
        birthDate,
        gender: data.gender,
      })
      .onConflictDoUpdate({
        target: staffs.userId,
        set: {
          nickname: name,
          birthDate,
          gender: data.gender,
        },
      });

    try {
      // อัปเดตข้อมูลในระบบ auth หลังจาก profile table สำเร็จ เพื่อให้ session/user data ตรงกัน
      await auth.api.updateUser({
        body: {
          name,
          phoneNumber,
        },
        headers: await headers(),
      });
    } catch (authError) {
      // ถ้า auth update ล้มเหลว ให้คืนค่า staff profile เดิมเพื่อลดปัญหาข้อมูลสองที่ไม่ตรงกัน
      if (previousStaff) {
        await db
          .update(staffs)
          .set({
            nickname: previousStaff.nickname,
            birthDate: previousStaff.birthDate,
            gender: previousStaff.gender,
          })
          .where(eq(staffs.userId, session.user.id));
      } else {
        await db.delete(staffs).where(eq(staffs.userId, session.user.id));
      }

      throw authError;
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("updateStaffProfile Error:", error);
    return {
      success: false,
      error: getErrorMessage(
        error,
        "เกิดข้อผิดพลาดในการแก้ไขข้อมูลโปรไฟล์พนักงาน",
      ),
    };
  }
}

export async function requestStaffEmailChange(
  data: RequestStaffEmailChangeInput,
): Promise<ActionResponse<null>> {
  try {
    const session = await getCurrentStaffSession();

    if (!session) {
      return { success: false, error: "ไม่พบข้อมูลผู้ใช้" };
    }

    const newEmail = data.newEmail.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(newEmail)) {
      return { success: false, error: "รูปแบบอีเมลไม่ถูกต้อง" };
    }

    if (newEmail === session.user.email.toLowerCase()) {
      return { success: false, error: "อีเมลใหม่ต้องไม่ซ้ำกับอีเมลปัจจุบัน" };
    }

    await auth.api.changeEmail({
      body: {
        newEmail,
        callbackURL: "/back-office/profile",
      },
      headers: await headers(),
    });

    return { success: true, data: null };
  } catch (error) {
    console.error("requestStaffEmailChange Error:", error);
    return {
      success: false,
      error: getErrorMessage(
        error,
        "เกิดข้อผิดพลาดในการส่งอีเมลยืนยัน",
      ),
    };
  }
}

export async function changeStaffPassword(
  data: ChangeStaffPasswordInput,
): Promise<ActionResponse<null>> {
  try {
    const session = await getCurrentStaffSession();

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
    console.error("changeStaffPassword Error:", error);
    return {
      success: false,
      error: getErrorMessage(
        error,
        "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน",
      ),
    };
  }
}

export async function setStaffPassword(
  data: SetStaffPasswordInput,
): Promise<ActionResponse<null>> {
  try {
    const session = await getCurrentStaffSession();

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
    console.error("setStaffPassword Error:", error);
    return {
      success: false,
      error: getErrorMessage(error, "เกิดข้อผิดพลาดในการตั้งรหัสผ่าน"),
    };
  }
}
