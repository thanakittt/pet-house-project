"use server";

import { db } from "@/db";
import { pets } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";
import { UpdatePetForm } from "../types/pet";
import {
  sanitizePetInput,
  validateActivePetBreed,
} from "./pet-action-helpers";

export async function updatePet(
  data: UpdatePetForm,
): Promise<ActionResponse<null>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "ไม่มีสิทธิ์แก้ไขข้อมูลสัตว์เลี้ยง",
      };
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
      .where(and(eq(pets.id, data.petId), isNull(pets.deletedAt)))
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
    console.error("updatePet error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลสัตว์เลี้ยง",
    };
  }
}
