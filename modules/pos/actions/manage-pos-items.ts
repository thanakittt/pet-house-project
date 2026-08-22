"use server";

import { db } from "@/db";
import {
  appointmentItems,
  appointments,
  pets,
  serviceVariants,
} from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/session";

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
      return {
        success: false,
        error: "ไม่พบรายการบริการที่ต้องการอัปเดต",
      };
    }

    revalidatePath("/pos");
    return { success: true, data: result[0] };
  } catch (error) {
    console.error("updateAppointmentItemPrice error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการอัปเดตราคา",
    };
  }
}

export async function addAppointmentItem(data: {
  appointmentId: string;
  petId: string;
  serviceId: string;
  price: number;
}) {
  try {
    const session = await requireStaff({ redirect: false });
    if (!session) {
      return { success: false, error: "ไม่มีสิทธิ์ดำเนินการ" };
    }

    if (!data.appointmentId || !data.petId || !data.serviceId) {
      return { success: false, error: "ข้อมูลบริการไม่ครบถ้วน" };
    }

    if (!Number.isFinite(data.price) || data.price <= 0) {
      return { success: false, error: "ราคาไม่ถูกต้อง" };
    }

    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, data.appointmentId),
      with: {
        items: {
          columns: {
            startTime: true,
            endTime: true,
          },
          orderBy: (t, { desc }) => [desc(t.endTime)],
          limit: 1,
        },
      },
    });

    if (!appointment) {
      return { success: false, error: "ไม่พบข้อมูลการจอง" };
    }

    const appointmentPetItem = await db.query.appointmentItems.findFirst({
      where: and(
        eq(appointmentItems.appointmentId, data.appointmentId),
        eq(appointmentItems.petId, data.petId),
      ),
      columns: {
        id: true,
      },
    });

    if (!appointmentPetItem) {
      return {
        success: false,
        error: "ไม่สามารถเพิ่มสัตว์เลี้ยงใหม่ในหน้า POS ได้",
      };
    }

    const pet = await db.query.pets.findFirst({
      where: eq(pets.id, data.petId),
      columns: {
        id: true,
      },
      with: {
        breed: {
          columns: {
            type: true,
            size: true,
          },
        },
      },
    });

    if (!pet) {
      return { success: false, error: "ไม่พบสัตว์เลี้ยง" };
    }

    const variants = await db.query.serviceVariants.findMany({
      where: and(
        eq(serviceVariants.serviceId, data.serviceId),
        eq(serviceVariants.petType, pet.breed.type),
        isNull(serviceVariants.deletedAt),
      ),
    });

    // POS stores only the selected service. Resolve the actual variant from the pet's breed size.
    const matchedVariant =
      variants.find((variant) => variant.size === pet.breed.size) ??
      variants.find((variant) => variant.size === "ALL");

    if (!matchedVariant) {
      return {
        success: false,
        error: "ไม่พบบริการที่รองรับขนาดสัตว์เลี้ยงตัวนี้",
      };
    }

    let newStartTime = new Date();
    let newEndTime = new Date();

    if (appointment.items && appointment.items.length > 0) {
      const lastItemEndTime = appointment.items[0].endTime;
      newStartTime = lastItemEndTime;
      newEndTime = lastItemEndTime;
    }

    await db.insert(appointmentItems).values({
      appointmentId: data.appointmentId,
      petId: data.petId,
      serviceVariantId: matchedVariant.id,
      price: data.price.toString(),
      startTime: newStartTime,
      endTime: newEndTime,
    });

    revalidatePath("/pos");
    revalidatePath("/appointments");

    return { success: true };
  } catch (error) {
    console.error("addAppointmentItem error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการเพิ่มบริการ",
    };
  }
}

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
      return {
        success: false,
        error: "ไม่พบรายการบริการที่ต้องการลบ",
      };
    }

    revalidatePath("/pos");
    return { success: true, data: result[0] };
  } catch (error) {
    console.error("removeAppointmentItem error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการลบบริการ",
    };
  }
}
