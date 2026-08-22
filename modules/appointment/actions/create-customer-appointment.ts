"use server";

import { db } from "@/db";
import {
  appointmentItems,
  appointments,
  customers,
  pets,
  services,
  serviceVariants,
} from "@/db/schema";
import { SHOP_CLOSED_DAY } from "@/lib/constants/appointment";
import { requireCustomer } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import { addMinutes, parseISO } from "date-fns";
import { and, eq, gt, inArray, isNull, lt, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type CustomerPetBookingInput = {
  petId: string;
  mainServiceId: string;
  addOnServiceIds: string[];
};

type CustomerPetWithBreed = {
  id: string;
  breed: {
    type: "DOG" | "CAT";
    size: "S" | "M" | "L" | "ALL";
  };
};

type ServiceVariantRecord = typeof serviceVariants.$inferSelect;

export interface CreateCustomerAppointmentInput {
  startTimeIso: string;
  petBookings: CustomerPetBookingInput[];
  note?: string;
  acceptedServiceRules?: boolean;
}

// หา variant ที่เหมาะกับสัตว์เลี้ยงตัวนั้นจาก service ที่ลูกค้าเลือก
// priority คือ match ขนาดจริงของพันธุ์ก่อน ถ้าไม่มีจึง fallback ไป size = ALL
function findMatchingVariant(
  variants: ServiceVariantRecord[],
  serviceId: string,
  pet: CustomerPetWithBreed,
): ServiceVariantRecord | undefined {
  const variantsForServiceAndType = variants.filter(
    (variant) =>
      variant.serviceId === serviceId && variant.petType === pet.breed.type,
  );

  return (
    variantsForServiceAndType.find(
      (variant) => variant.size === pet.breed.size,
    ) ?? variantsForServiceAndType.find((variant) => variant.size === "ALL")
  );
}

export async function createCustomerAppointment(
  data: CreateCustomerAppointmentInput,
): Promise<ActionResponse<{ appointmentId: string; appointmentCreatedAt: string }>> {
  try {
    // action นี้เป็น customer-facing จึงใช้ requireCustomer แทน requireStaff
    // และต้องตรวจ owner ของ pet ทุกตัวใน server อีกครั้ง
    const session = await requireCustomer({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "กรุณาเข้าสู่ระบบก่อนจองคิว",
      };
    }

    if (!data.petBookings || data.petBookings.length === 0) {
      return {
        success: false,
        error: "กรุณาเลือกสัตว์เลี้ยงอย่างน้อย 1 ตัว",
      };
    }

    if (!data.startTimeIso) {
      return {
        success: false,
        error: "กรุณาเลือกวันและเวลาที่ต้องการจอง",
      };
    }

    if (data.acceptedServiceRules !== true) {
      return {
        success: false,
        error: "กรุณายอมรับกฎการเข้ารับบริการก่อนยืนยันการจอง",
      };
    }

    for (const booking of data.petBookings) {
      if (!booking.petId || !booking.mainServiceId) {
        return {
          success: false,
          error: "กรุณาเลือกสัตว์เลี้ยงและบริการหลักให้ครบถ้วน",
        };
      }
    }

    const customer = await db.query.customers.findFirst({
      columns: {
        id: true,
      },
      where: and(eq(customers.userId, session.user.id), isNull(customers.deletedAt)),
    });

    if (!customer) {
      return {
        success: false,
        error: "ไม่พบโปรไฟล์ลูกค้า กรุณาตั้งค่าโปรไฟล์ก่อนจองคิว",
      };
    }

    const initialStartTime = parseISO(data.startTimeIso);

    if (Number.isNaN(initialStartTime.getTime())) {
      return {
        success: false,
        error: "รูปแบบวันและเวลาไม่ถูกต้อง",
      };
    }

    const dateString = data.startTimeIso.split("T")[0];
    const appointmentDate = new Date(`${dateString}T00:00:00Z`);

    // ตรวจ server-side ว่าเวลานัดหมายต้องไม่ผ่านมาแล้ว
    // ทำหลัง isNaN check เพราะต้องแน่ใจว่า initialStartTime อ่านได้ก่อน
    // ป้องกัน user ที่ bypass UI date-picker แล้วส่ง ISO ในอดีตมาตรง ๆ
    if (initialStartTime.getTime() <= Date.now()) {
      return {
        success: false,
        error: "ไม่สามารถจองคิวในเวลาที่ผ่านมาแล้วได้",
      };
    }

    // ใช้ค่ากลาง SHOP_CLOSED_DAY เพื่อให้ UI และ server ปิดวันเดียวกัน
    // server check สำคัญเพราะ user อาจ bypass UI แล้วเรียก action ตรง ๆ
    if (appointmentDate.getUTCDay() === SHOP_CLOSED_DAY) {
      return {
        success: false,
        error: "ไม่สามารถจองคิวในวันหยุดของร้านได้",
      };
    }

    const allPetIds = new Set<string>();
    const allServiceIds = new Set<string>();

    // รวม petId/serviceId ทั้งหมดก่อนเข้า transaction เพื่อ query ข้อมูลครั้งเดียว
    // ลด N+1 query และทำให้ validation ทุกอย่างอยู่ใน transaction เดียวกัน
    data.petBookings.forEach((booking) => {
      allPetIds.add(booking.petId);
      allServiceIds.add(booking.mainServiceId);
      (booking.addOnServiceIds || []).forEach((serviceId) => {
        if (serviceId) allServiceIds.add(serviceId);
      });
    });

    let appointmentId = "";
    let appointmentCreatedAt = "";

    await db.transaction(async (tx) => {
      // ดึงเฉพาะ pet ที่เป็นของ customer คนนี้เท่านั้น
      // ถ้าลูกค้าส่ง petId ของคนอื่นมา selectedPets.length จะไม่ครบและ action จะ reject
      const selectedPets = await tx.query.pets.findMany({
        where: and(
          inArray(pets.id, Array.from(allPetIds)),
          eq(pets.customerId, customer.id),
          isNull(pets.deletedAt),
        ),
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

      if (selectedPets.length !== allPetIds.size) {
        throw new Error("ข้อมูลสัตว์เลี้ยงบางรายการไม่ถูกต้อง");
      }

      // ── ตรวจ service type ก่อน query variants ─────────────────────────────────────
      // ป้องกัน payload ที่ส่ง mainServiceId เป็น ADDON หรือ addOnServiceId เป็น MAIN
      // ซึ่ง UI ป้องกันอยู่แล้ว แต่ server ต้องตรวจซ้ำเพราะ action เรียกได้โดยตรง
      const selectedServices = await tx.query.services.findMany({
        where: and(
          inArray(services.id, Array.from(allServiceIds)),
          isNull(services.deletedAt),
        ),
        columns: { id: true, serviceType: true },
      });

      // สร้าง map id → serviceType เพื่อค้นหาเร็วใน loop ด้านล่าง
      const serviceTypeMap = new Map(
        selectedServices.map((s) => [s.id, s.serviceType]),
      );

      // ตรวจแต่ละ booking: main ต้อง MAIN, add-on ต้อง ADDON, ไม่ซ้ำกัน
      for (const booking of data.petBookings) {
        // 1) mainServiceId ต้องเป็น MAIN
        if (serviceTypeMap.get(booking.mainServiceId) !== "MAIN") {
          throw new Error(
            "บริการหลักที่เลือกไม่ถูกต้อง กรุณาเลือกใหม่",
          );
        }

        // 2) add-on แต่ละรายการต้องเป็น ADDON และต้องไม่ใช่ mainServiceId
        const seenAddOnIds = new Set<string>();
        for (const addOnId of booking.addOnServiceIds || []) {
          if (addOnId === booking.mainServiceId) {
            throw new Error(
              "บริการเสริมต้องไม่ซ้ำกับบริการหลัก กรุณาเลือกใหม่",
            );
          }
          if (seenAddOnIds.has(addOnId)) {
            throw new Error(
              "บริการเสริมซ้ำกัน กรุณาตรวจสอบรายการที่เลือก",
            );
          }
          if (serviceTypeMap.get(addOnId) !== "ADDON") {
            throw new Error(
              "บริการเสริมที่เลือกไม่ถูกต้อง กรุณาเลือกใหม่",
            );
          }
          seenAddOnIds.add(addOnId);
        }
      }

      // ดึง variants จาก service ทั้งหมดที่เลือก แล้วค่อย match type/size ใน memory
      // วิธีนี้ช่วยให้ main service และ add-on ใช้ logic เดียวกัน
      const selectedVariants = await tx.query.serviceVariants.findMany({
        where: and(
          inArray(serviceVariants.serviceId, Array.from(allServiceIds)),
          isNull(serviceVariants.deletedAt),
        ),
      });

      // ตรวจว่าลูกค้าคนนี้มีการจองที่อยู่ในสถานะ PENDING_DEPOSIT อยู่แล้วหรือไม่
      // ทำภายใน transaction เพื่อให้การอ่านและการ insert อยู่ใน unit เดียวกัน
      // ป้องกันลูกค้าสร้างการจองซ้อนโดยกด submit หลายครั้งหรือเปิด tab หลายหน้าต่าง
      //
      // หมายเหตุ: แนะนำให้เพิ่ม unique partial index ระดับ DB เป็น safeguard เพิ่มเติม
      // เช่น: CREATE UNIQUE INDEX ON appointments (customer_id)
      //        WHERE status = 'PENDING_DEPOSIT' AND deleted_at IS NULL;
      // ซึ่งจะปิดช่องว่าง race condition ที่เกิดขึ้นระหว่าง check นี้กับ insert ด้านล่าง
      const existingPendingDeposit = await tx.query.appointments.findFirst({
        columns: { id: true },
        where: and(
          eq(appointments.customerId, customer.id),
          eq(appointments.status, "PENDING_DEPOSIT"),
          isNull(appointments.deletedAt),
        ),
      });

      if (existingPendingDeposit) {
        throw new Error(
          "คุณมีการจองที่รอชำระมัดจำอยู่แล้ว กรุณาชำระมัดจำหรือรอให้การจองก่อนหน้าหมดอายุก่อน",
        );
      }

      // จองจากหน้าลูกค้าจะเริ่มที่ PENDING_DEPOSIT เสมอ
      // หลัง upload slip และ Thunder verify ผ่าน จึงเปลี่ยนเป็น CONFIRMED
      const [newAppointment] = await tx
        .insert(appointments)
        .values({
          appointmentDate: dateString,
          customerId: customer.id,
          status: "PENDING_DEPOSIT",
          note: data.note?.trim() || null,
        })
        .returning({
          id: appointments.id,
          createdAt: appointments.createdAt,
        });

      appointmentId = newAppointment.id;
      appointmentCreatedAt = newAppointment.createdAt.toISOString();

      const itemsToInsert = [];
      let currentStartTime = initialStartTime;

      // แตก booking ของสัตว์แต่ละตัวเป็น appointment_items ต่อเนื่องกันตามเวลา
      // main service มาก่อน จากนั้นตามด้วย add-on ของสัตว์ตัวเดียวกัน
      for (const booking of data.petBookings) {
        const pet = selectedPets.find((item) => item.id === booking.petId);

        if (!pet) {
          throw new Error("ไม่พบข้อมูลสัตว์เลี้ยง");
        }

        const mainVariant = findMatchingVariant(
          selectedVariants,
          booking.mainServiceId,
          pet,
        );

        if (!mainVariant) {
          throw new Error("บริการหลักที่เลือกไม่รองรับสัตว์เลี้ยงบางตัว");
        }

        const mainEndTime = addMinutes(
          currentStartTime,
          mainVariant.durationMinutes || 0,
        );

        itemsToInsert.push({
          appointmentId: newAppointment.id,
          petId: booking.petId,
          serviceVariantId: mainVariant.id,
          price: mainVariant.minPrice.toString(),
          startTime: currentStartTime,
          endTime: mainEndTime,
        });

        currentStartTime = mainEndTime;

        for (const addOnServiceId of booking.addOnServiceIds || []) {
          const addOnVariant = findMatchingVariant(
            selectedVariants,
            addOnServiceId,
            pet,
          );

          if (!addOnVariant) {
            throw new Error("บริการเสริมที่เลือกไม่รองรับสัตว์เลี้ยงบางตัว");
          }

          const addOnEndTime = addMinutes(
            currentStartTime,
            addOnVariant.durationMinutes || 0,
          );

          itemsToInsert.push({
            appointmentId: newAppointment.id,
            petId: booking.petId,
            serviceVariantId: addOnVariant.id,
            price: addOnVariant.minPrice.toString(),
            startTime: currentStartTime,
            endTime: addOnEndTime,
          });

          currentStartTime = addOnEndTime;
        }
      }

      const overlapConditions = itemsToInsert.map((item) =>
        and(
          lt(appointmentItems.startTime, item.endTime),
          gt(appointmentItems.endTime, item.startTime),
        ),
      );

      // ตรวจ slot collision ใน transaction และ lock แถวที่ชน
      // ทำให้เคสลูกค้ากดจองเวลาเดียวกันพร้อมกัน มีเพียงคนเดียวที่ผ่าน
      const collisions = await tx
        .select({ id: appointmentItems.id })
        .from(appointmentItems)
        .innerJoin(
          appointments,
          eq(appointmentItems.appointmentId, appointments.id),
        )
        .where(
          and(
            eq(appointments.appointmentDate, dateString),
            inArray(appointments.status, [
              "PENDING_DEPOSIT",
              "PENDING_APPROVAL",
              "CONFIRMED",
              "CHECKED_IN",
              "IN_PROGRESS",
              "READY_FOR_PICKUP",
            ]),
            or(...overlapConditions),
          ),
        )
        .for("update");

      if (collisions.length > 0) {
        throw new Error(
          "ช่วงเวลานี้ถูกจองไปแล้ว กรุณารีเฟรชและเลือกเวลาใหม่",
        );
      }

      // insert items หลังจากผ่าน validation และ collision check ทั้งหมดแล้วเท่านั้น
      await tx.insert(appointmentItems).values(itemsToInsert);
    });

    revalidatePath("/appointments/new");
    revalidatePath("/back-office/appointments");

    return { success: true, data: { appointmentId, appointmentCreatedAt } };
  } catch (error) {
    console.error("createCustomerAppointment error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "ไม่สามารถบันทึกการจองได้",
    };
  }
}
