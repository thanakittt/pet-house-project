"use server";

import { db } from "@/db";
import {
  appointments,
  appointmentItems,
  pets,
  serviceVariants,
} from "@/db/schema";
import { inArray, and, or, lt, gt, eq, isNull } from "drizzle-orm";
import { addMinutes, parseISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/types/action";
import { requireStaff } from "@/lib/session";
import { SHOP_CLOSED_DAY } from "@/lib/constants/appointment";

type PetBookingInput = {
  petId: string;
  mainServiceId: string;
  addOnServiceIds: string[];
};

type PetWithBreed = {
  id: string;
  breed: {
    type: "DOG" | "CAT";
    size: "S" | "M" | "L" | "ALL";
  };
};

type ServiceVariantRecord = typeof serviceVariants.$inferSelect;

export interface CreateMultipleAppointmentInput {
  customerId: string;
  startTimeIso: string;
  petBookings: PetBookingInput[];
  note?: string;
}

function findMatchingVariant(
  variants: ServiceVariantRecord[],
  serviceId: string,
  pet: PetWithBreed,
): ServiceVariantRecord | undefined {
  const variantsForServiceAndType = variants.filter(
    (variant) =>
      variant.serviceId === serviceId && variant.petType === pet.breed.type,
  );

  // Exact size wins. ALL means the same service variant is valid for S/M/L.
  return (
    variantsForServiceAndType.find(
      (variant) => variant.size === pet.breed.size,
    ) ?? variantsForServiceAndType.find((variant) => variant.size === "ALL")
  );
}

export async function createAppointment(
  data: CreateMultipleAppointmentInput,
): Promise<ActionResponse<{ appointmentId: string }>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่มีสิทธิ์ในการดำเนินการนี้",
      };
    }

    if (!data.petBookings || data.petBookings.length === 0) {
      return {
        success: false,
        error: "ไม่พบข้อมูลสัตว์เลี้ยงที่ต้องการรับบริการ",
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

    const initialStartTime = parseISO(data.startTimeIso);
    const dateString = data.startTimeIso.split("T")[0];
    const appointmentDate = new Date(`${dateString}T00:00:00Z`);
    const appointmentDateValue = dateString;

    if (appointmentDate.getUTCDay() === SHOP_CLOSED_DAY) {
      return {
        success: false,
        error: "ไม่สามารถจองคิวในวันหยุดของร้านได้",
      };
    }

    const allPetIds = new Set<string>();
    const allServiceIds = new Set<string>();

    data.petBookings.forEach((booking) => {
      allPetIds.add(booking.petId);
      allServiceIds.add(booking.mainServiceId);
      (booking.addOnServiceIds || []).forEach((serviceId) => {
        if (serviceId) allServiceIds.add(serviceId);
      });
    });

    let appointmentId = "";

    await db.transaction(async (tx) => {
      const selectedPets = await tx.query.pets.findMany({
        where: inArray(pets.id, Array.from(allPetIds)),
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

      // Server resolves variants again because client data is only a hint, not trusted.
      const selectedVariants = await tx.query.serviceVariants.findMany({
        where: and(
          inArray(serviceVariants.serviceId, Array.from(allServiceIds)),
          isNull(serviceVariants.deletedAt),
        ),
      });

      const [newAppointment] = await tx
        .insert(appointments)
        .values({
          appointmentDate: appointmentDateValue,
          customerId: data.customerId,
          status: "PENDING_DEPOSIT",
          note: data.note || null,
        })
        .returning({ id: appointments.id });

      appointmentId = newAppointment.id;

      const itemsToInsert = [];
      let currentStartTime = initialStartTime;

      for (const booking of data.petBookings) {
        const pet = selectedPets.find((item) => item.id === booking.petId);
        if (!pet) {
          throw new Error(`ไม่พบสัตว์เลี้ยงรหัส ${booking.petId}`);
        }

        const mainVariant = findMatchingVariant(
          selectedVariants,
          booking.mainServiceId,
          pet,
        );
        if (!mainVariant) {
          throw new Error(
            `ไม่พบบริการหลักที่รองรับขนาดสัตว์เลี้ยงรหัส ${booking.petId}`,
          );
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
            throw new Error(
              `ไม่พบบริการเสริมที่รองรับขนาดสัตว์เลี้ยงรหัส ${booking.petId}`,
            );
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

      if (itemsToInsert.length > 0) {
        const overlapConditions = itemsToInsert.map((item) =>
          and(
            lt(appointmentItems.startTime, item.endTime),
            gt(appointmentItems.endTime, item.startTime),
          ),
        );

        const collisions = await tx
          .select({ id: appointmentItems.id })
          .from(appointmentItems)
          .innerJoin(
            appointments,
            eq(appointmentItems.appointmentId, appointments.id),
          )
          .where(
            and(
              eq(appointments.appointmentDate, appointmentDateValue),
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
            "เกิดข้อผิดพลาด: มีบางช่วงเวลาถูกจองไปแล้วในขณะที่คุณกำลังทำรายการ กรุณารีเฟรชและเลือกเวลาใหม่",
          );
        }

        await tx.insert(appointmentItems).values(itemsToInsert);
      }
    });

    revalidatePath("/appointments/create");
    revalidatePath("/appointments");

    return { success: true, data: { appointmentId } };
  } catch (error) {
    console.error("Create Appointment Transaction Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
    };
  }
}
