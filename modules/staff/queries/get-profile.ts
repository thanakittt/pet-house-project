import { db } from "@/db";
import { staffs } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { eq } from "drizzle-orm";

export type StaffProfile = {
  staffId: string | null;
  name: string;
  phoneNumber: string | null;
  email: string;
  birthDate: string | null;
  gender: "MALE" | "FEMALE" | "UNSPECIFIED";
  role: string | null | undefined;
  hasPassword: boolean;
};

export async function getStaffProfile(user: {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  role?: string | null;
}): Promise<ActionResponse<StaffProfile>> {
  try {
    const staff = await db.query.staffs.findFirst({
      columns: {
        id: true,
        birthDate: true,
        gender: true,
      },
      where: eq(staffs.userId, user.id),
    });

    const credentialAccount = await db.query.accounts.findFirst({
      columns: {
        id: true,
      },
      where: (accountTable, { and, eq, isNotNull }) =>
        and(
          eq(accountTable.userId, user.id),
          eq(accountTable.providerId, "credential"),
          isNotNull(accountTable.password),
        ),
    });

    return {
      success: true,
      data: {
        staffId: staff?.id ?? null,
        name: user.name,
        phoneNumber: user.phoneNumber ?? null,
        email: user.email,
        birthDate: staff?.birthDate ?? null,
        gender: staff?.gender ?? "UNSPECIFIED",
        role: user.role,
        hasPassword: Boolean(credentialAccount),
      },
    };
  } catch (error) {
    console.error("getStaffProfile Error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์พนักงาน",
    };
  }
}
