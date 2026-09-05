import { db } from "@/db";
import { customers, pets } from "@/db/schema";
import { requireAdminAndOwner } from "@/lib/session";
import { and, desc, isNotNull, isNull } from "drizzle-orm";
import type { LineConnectedCustomer } from "../types/line-connected-customer";

/**
 * ดึงรายชื่อ Line Connected Customers (ลูกค้าที่มี line_user_id และไม่ถูกลบ)
 * เฉพาะ Admin และ Owner เท่านั้นที่สามารถเรียกใช้งานได้
 */
export async function listLineConnectedCustomers(): Promise<LineConnectedCustomer[]> {
  const session = await requireAdminAndOwner({ redirect: false });

  if (!session) {
    throw new Error("Unauthorized: เฉพาะผู้ดูแลระบบและเจ้าของร้านเท่านั้นที่มีสิทธิ์เข้าถึงข้อมูลลูกค้า");
  }

  const rows = await db.query.customers.findMany({
    where: and(isNotNull(customers.lineUserId), isNull(customers.deletedAt)),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
      pets: {
        where: isNull(pets.deletedAt),
        columns: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: desc(customers.createdAt),
  });

  return rows.map((customer) => ({
    id: customer.id,
    nickname: customer.nickname,
    userName: customer.user?.name ?? null,
    contactPhoneNumber:
      customer.walkInPhoneNumber || customer.user?.phoneNumber || null,
    lineUserId: customer.lineUserId as string,
    petNames: customer.pets.map((pet) => pet.name),
  }));
}
