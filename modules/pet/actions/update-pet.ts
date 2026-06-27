"use server";

import { db } from "@/db";
import { pets } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";
import {
  getPetProfileImageStorageKeyFromUrl,
  removePetProfileImagesFromStorage,
  uploadPetProfileImageToStorage,
} from "../utils/pet-profile-image-storage";
import {
  getPetProfileImageFile,
  getRequiredFormDataString,
  parsePetFormData,
  sanitizePetInput,
  validateActivePetBreed,
  validatePetProfileImageFile,
} from "./pet-action-helpers";

export async function updatePet(
  formData: FormData,
): Promise<ActionResponse<null>> {
  let uploadedStorageKey: string | null = null;

  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "ไม่มีสิทธิ์แก้ไขข้อมูลสัตว์เลี้ยง",
      };
    }

    const parsed = parsePetFormData(formData);

    if (!parsed.success) {
      return parsed;
    }

    const petId = getRequiredFormDataString(formData, "petId");

    if (!petId) {
      return {
        success: false,
        error: "ไม่พบรหัสสัตว์เลี้ยง",
      };
    }

    const sanitized = sanitizePetInput(parsed.data);

    if (!sanitized.success) {
      return sanitized;
    }

    const activeBreed = await validateActivePetBreed(sanitized.data.petBreedId);

    if (!activeBreed.success) {
      return activeBreed;
    }

    const currentPet = await db.query.pets.findFirst({
      columns: {
        id: true,
        imageUrl: true,
        imageStorageKey: true,
      },
      where: and(eq(pets.id, petId), isNull(pets.deletedAt)),
    });

    if (!currentPet) {
      return {
        success: false,
        error: "ไม่พบสัตว์เลี้ยงที่ต้องการแก้ไข",
      };
    }

    const petImage = getPetProfileImageFile(formData);
    const imageValidation = validatePetProfileImageFile(petImage);

    if (!imageValidation.success) {
      return imageValidation;
    }

    const shouldRemoveImage = formData.get("removeImage") === "true";
    const uploadedImage = petImage
      ? await uploadPetProfileImageToStorage({
          petId,
          imageFile: petImage,
        })
      : null;

    uploadedStorageKey = uploadedImage?.storageKey ?? null;

    const result = await db
      .update(pets)
      .set({
        name: sanitized.data.name,
        medicalNotes: sanitized.data.medicalNotes,
        petBreedId: sanitized.data.petBreedId,
        ...(uploadedImage
          ? {
              imageUrl: uploadedImage.publicUrl,
              imageStorageKey: uploadedImage.storageKey,
            }
          : shouldRemoveImage
            ? {
                imageUrl: null,
                imageStorageKey: null,
              }
            : {}),
      })
      .where(and(eq(pets.id, petId), isNull(pets.deletedAt)))
      .returning({ id: pets.id });

    if (result.length === 0) {
      return {
        success: false,
        error: "ไม่พบสัตว์เลี้ยงที่ต้องการแก้ไข",
      };
    }

    if (uploadedImage || shouldRemoveImage) {
      const oldStorageKey =
        currentPet.imageStorageKey ??
        getPetProfileImageStorageKeyFromUrl(currentPet.imageUrl);

      if (oldStorageKey) {
        await removePetProfileImagesFromStorage([oldStorageKey]);
      }
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("updatePet error:", error);

    if (uploadedStorageKey) {
      await removePetProfileImagesFromStorage([uploadedStorageKey]);
    }

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลสัตว์เลี้ยง",
    };
  }
}
