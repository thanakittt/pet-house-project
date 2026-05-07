"use server";

import { db } from "@/db";
import { pets } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";
import { CreatePetForm, UpdatePetForm } from "../types/pet";
import {
  getCurrentCustomerId,
  sanitizePetInput,
  validateActivePetBreed,
} from "./pet-action-helpers";

export async function createCustomerPet(
  data: CreatePetForm,
): Promise<ActionResponse<null>> {
  try {
    const customerId = await getCurrentCustomerId();

    if (!customerId.success) {
      return customerId;
    }

    const sanitized = sanitizePetInput(data);

    if (!sanitized.success) {
      return sanitized;
    }

    const activeBreed = await validateActivePetBreed(sanitized.data.petBreedId);

    if (!activeBreed.success) {
      return activeBreed;
    }

    await db.insert(pets).values({
      name: sanitized.data.name,
      medicalNotes: sanitized.data.medicalNotes,
      petBreedId: sanitized.data.petBreedId,
      customerId: customerId.data,
    });

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("createCustomerPet error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการสร้างสัตว์เลี้ยง",
    };
  }
}

export async function updateCustomerPet(
  data: UpdatePetForm,
): Promise<ActionResponse<null>> {
  try {
    const customerId = await getCurrentCustomerId();

    if (!customerId.success) {
      return customerId;
    }

    const sanitized = sanitizePetInput(data);

    if (!sanitized.success) {
      return sanitized;
    }

    const activeBreed = await validateActivePetBreed(sanitized.data.petBreedId);

    if (!activeBreed.success) {
      return activeBreed;
    }

    const result = await db
      .update(pets)
      .set({
        name: sanitized.data.name,
        medicalNotes: sanitized.data.medicalNotes,
        petBreedId: sanitized.data.petBreedId,
      })
      .where(
        and(
          eq(pets.id, data.petId),
          eq(pets.customerId, customerId.data),
          isNull(pets.deletedAt),
        ),
      )
      .returning({ id: pets.id });

    if (result.length === 0) {
      return {
        success: false,
        error: "ไม่พบสัตว์เลี้ยงที่ต้องการแก้ไข",
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("updateCustomerPet error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลสัตว์เลี้ยง",
    };
  }
}

export async function deleteCustomerPet({
  id,
}: {
  id: string;
}): Promise<ActionResponse<null>> {
  try {
    const customerId = await getCurrentCustomerId();

    if (!customerId.success) {
      return customerId;
    }

    const result = await db
      .update(pets)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(pets.id, id),
          eq(pets.customerId, customerId.data),
          isNull(pets.deletedAt),
        ),
      )
      .returning({ id: pets.id });

    if (result.length === 0) {
      return {
        success: false,
        error: "ไม่พบข้อมูลสัตว์เลี้ยงที่ต้องการลบ",
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("deleteCustomerPet error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการลบข้อมูลสัตว์เลี้ยง",
    };
  }
}
