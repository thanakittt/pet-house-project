import { db } from "@/db";
import { customers } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { eq } from "drizzle-orm";

export type CustomerProfile = {
  customerId: string;
  name: string;
  phoneNumber: string | null;
  email: string;
  birthDate: string | null;
  gender: "MALE" | "FEMALE" | "UNSPECIFIED";
  hasPassword: boolean;
  hasLineConnection: boolean;
};

export async function getCustomerProfile(
  user: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string | null;
  },
): Promise<ActionResponse<CustomerProfile | null>> {
  try {
    const customer = await db.query.customers.findFirst({
      columns: {
        id: true,
        birthDate: true,
        gender: true,
        lineUserId: true,
      },
      where: eq(customers.userId, user.id),
    });

    if (!customer) {
      return { success: true, data: null };
    }

    const credentialAccount = await db.query.accounts.findFirst({
      columns: {
        id: true,
      },
      where: (accounts, { and, eq, isNotNull }) =>
        and(
          eq(accounts.userId, user.id),
          eq(accounts.providerId, "credential"),
          isNotNull(accounts.password),
        ),
    });

    return {
      success: true,
      data: {
        customerId: customer.id,
        name: user.name,
        phoneNumber: user.phoneNumber ?? null,
        email: user.email,
        birthDate: customer.birthDate,
        gender: customer.gender,
        hasPassword: Boolean(credentialAccount),
        hasLineConnection: Boolean(customer.lineUserId),
      },
    };
  } catch (error) {
    console.error("getCustomerProfile Error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์",
    };
  }
}
