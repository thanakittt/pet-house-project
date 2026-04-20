"use server";

import { db } from "@/db";
import { appointmentItems, appointments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/session";

// 1. อัปเดตราคาบริการ
export async function updateAppointmentItemPrice(
  itemId: string,
  newPrice: number,
) {
  try {
    const session = await requireStaff({ redirect: false });
    if (!session) {
      return { success: false, error: "ไม่มีสิทธิ์ดำเนินการ" };
    }

    if (typeof newPrice !== "number" || !Number.isFinite(newPrice)) {
      return { success: false, error: "ราคาไม่ถูกต้อง" };
    }
    if (newPrice < 0) {
      return { success: false, error: "ราคาต้องไม่ติดลบ" };
    }
    if (newPrice > 999999.99) {
      return { success: false, error: "ราคาต้องไม่เกิน 999,999.99" };
    }

    const normalizedPrice = Math.round(newPrice * 100) / 100;

    const result = await db
      .update(appointmentItems)
      .set({ price: normalizedPrice.toString() })
      .where(eq(appointmentItems.id, itemId))
      .returning({ id: appointmentItems.id });

    if (result.length === 0) {
      return { success: false, error: "ไม่พบรายการบริการที่ต้องการอัปเดต" };
    }

    revalidatePath("/pos");
    return { success: true, data: result[0] };
  } catch (error) {
    console.error("updateAppointmentItemPrice error:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการอัปเดตราคา" };
  }
}

// 2. เพิ่มบริการใหม่หน้างาน
export async function addAppointmentItem(data: {
  appointmentId: string;
  petId: string;
  serviceVariantId: string;
  price: number;
}) {
  try {
    const session = await requireStaff({ redirect: false });
    if (!session) {
      return { success: false, error: "ไม่มีสิทธิ์ดำเนินการ" };
    }

    // 1. ค้นหารายการบริการล่าสุดของการจองนี้ เพื่อดึงเวลาสิ้นสุด (endTime)
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, data.appointmentId),
      with: {
        items: {
          columns: {
            startTime: true,
            endTime: true,
          },
          orderBy: (t, { desc }) => [desc(t.endTime)], // เรียงเอาตัวที่จบช้าที่สุดขึ้นก่อน
          limit: 1,
        },
      },
    });

    if (!appointment) {
      return { success: false, error: "ไม่พบข้อมูลการจอง" };
    }

    // 2. กำหนดเวลาสำหรับ Add-on หน้างาน
    // Default ให้เป็นเวลาปัจจุบันไว้ก่อน (เผื่อกรณีสุดวิสัยที่ไม่มี item เลย)
    let newStartTime = new Date();
    let newEndTime = new Date();

    // หากมีรายการบริการเดิมอยู่แล้ว ให้ต่อท้ายเวลาของบริการล่าสุด
    // โดยให้ระยะเวลาเป็น 0 นาที (start = end) เพื่อไม่ให้กินเวลาคิวถัดไปบนตาราง
    if (appointment.items && appointment.items.length > 0) {
      const lastItemEndTime = appointment.items[0].endTime;
      newStartTime = lastItemEndTime;
      newEndTime = lastItemEndTime;
    }

    // 3. บันทึกข้อมูลลงฐานข้อมูล
    await db.insert(appointmentItems).values({
      appointmentId: data.appointmentId,
      petId: data.petId,
      serviceVariantId: data.serviceVariantId,
      price: data.price.toString(),
      startTime: newStartTime,
      endTime: newEndTime,
    });

    // สั่งรีเฟรชหน้า POS และ Calendar
    revalidatePath("/pos");
    revalidatePath("/appointments");

    return { success: true };
  } catch (error) {
    console.error("addAppointmentItem error:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการเพิ่มบริการ" };
  }
}

// 3. ลบบริการออก
export async function removeAppointmentItem(itemId: string) {
  try {
    const session = await requireStaff({ redirect: false });
    if (!session) {
      return { success: false, error: "ไม่มีสิทธิ์ดำเนินการ" };
    }
    const result = await db
      .delete(appointmentItems)
      .where(eq(appointmentItems.id, itemId))
      .returning({ id: appointmentItems.id });
    if (result.length === 0) {
      return { success: false, error: "ไม่พบรายการบริการที่ต้องการลบ" };
    }
    revalidatePath("/pos");
    return { success: true, data: result[0] };
  } catch (error) {
    console.error("removeAppointmentItem error:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการลบบริการ" };
  }
}
