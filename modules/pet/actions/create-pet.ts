"use server";

import { db } from "@/db";
import { pets } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import { removePetProfileImagesFromStorage, uploadPetProfileImageToStorage } from "../utils/pet-profile-image-storage";
import {
  getPetProfileImageFile,
  getRequiredFormDataString,
  parsePetFormData,
  sanitizePetInput,
  validateActivePetBreed,
  validatePetProfileImageFile,
} from "./pet-action-helpers";

export async function createPet(
  formData: FormData,
): Promise<ActionResponse<null>> {
  let uploadedStorageKey: string | null = null;

  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "ไม่มีสิทธิ์สร้างข้อมูลสัตว์เลี้ยง",
      };
    }

    const parsed = parsePetFormData(formData);

    if (!parsed.success) {
      return parsed;
    }

    const customerId = getRequiredFormDataString(formData, "customerId");

    if (!customerId) {
      return {
        success: false,
        error: "ไม่พบรหัสลูกค้า",
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

    const petImage = getPetProfileImageFile(formData);
    const imageValidation = validatePetProfileImageFile(petImage);

    if (!imageValidation.success) {
      return imageValidation;
    }

    const petId = crypto.randomUUID();
    const uploadedImage = petImage
      ? await uploadPetProfileImageToStorage({
          petId,
          imageFile: petImage,
        })
      : null;

    uploadedStorageKey = uploadedImage?.storageKey ?? null;

    await db.insert(pets).values({
      id: petId,
      name: sanitized.data.name,
      medicalNotes: sanitized.data.medicalNotes,
      petBreedId: sanitized.data.petBreedId,
      customerId,
      imageUrl: uploadedImage?.publicUrl ?? null,
      imageStorageKey: uploadedImage?.storageKey ?? null,
    });

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("createPet error:", error);

    if (uploadedStorageKey) {
      await removePetProfileImagesFromStorage([uploadedStorageKey]);
    }

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการสร้างสัตว์เลี้ยง",
    };
  }
}
