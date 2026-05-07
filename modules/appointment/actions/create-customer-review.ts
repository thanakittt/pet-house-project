"use server";

import { db } from "@/db";
import { appointments, reviews } from "@/db/schema";
import { requireCustomer } from "@/lib/session";
import { getCustomerProfile } from "@/modules/customer/queries/get-profile";
import type { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type CreateCustomerReviewInput = {
  appointmentId: string;
  rating: number;
  comment?: string;
};

export async function createCustomerReview(
  data: CreateCustomerReviewInput,
): Promise<ActionResponse<null>> {
  try {
    const session = await requireCustomer({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "กรุณาเข้าสู่ระบบก่อนรีวิวบริการ",
      };
    }

    const profile = await getCustomerProfile(session.user);

    if (!profile.success) {
      return profile;
    }

    if (!profile.data) {
      return {
        success: false,
        error: "ไม่พบโปรไฟล์ลูกค้า",
      };
    }

    const appointmentId = data.appointmentId.trim();
    const rating = Number(data.rating);
    const comment = data.comment?.trim() || null;

    if (!appointmentId) {
      return {
        success: false,
        error: "ไม่พบรหัสการนัดหมาย",
      };
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return {
        success: false,
        error: "กรุณาให้คะแนนตั้งแต่ 1 ถึง 5 ดาว",
      };
    }

    // ตรวจ appointment จาก DB ใหม่ทุกครั้ง เพราะ client สามารถแก้ค่าใน browser ได้
    // จึงต้องยืนยันว่า appointment นี้เป็นของ customer ที่ login อยู่จริง
    const appointment = await db.query.appointments.findFirst({
      columns: {
        id: true,
        status: true,
      },
      where: and(
        eq(appointments.id, appointmentId),
        eq(appointments.customerId, profile.data.customerId),
        isNull(appointments.deletedAt),
      ),
      with: {
        review: true,
      },
    });

    if (!appointment) {
      return {
        success: false,
        error: "ไม่พบการนัดหมายของบัญชีนี้",
      };
    }

    if (appointment.status !== "COMPLETED") {
      return {
        success: false,
        error: "รีวิวได้เฉพาะบริการที่เสร็จสมบูรณ์แล้ว",
      };
    }

    if (appointment.review) {
      return {
        success: false,
        error: "การนัดหมายนี้มีรีวิวแล้ว",
      };
    }

    await db.insert(reviews).values({
      appointmentId,
      customerId: profile.data.customerId,
      rating,
      comment,
    });

    revalidatePath("/appointments");
    revalidatePath(`/appointments/${appointmentId}`);
    revalidatePath("/back-office/dashboard");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("createCustomerReview error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการบันทึกรีวิว กรุณาลองใหม่อีกครั้ง",
    };
  }
}
