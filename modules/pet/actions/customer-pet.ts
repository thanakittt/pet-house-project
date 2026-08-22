"use server";

import { db } from "@/db";
import { pets } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";
import {
  getCurrentCustomerId,
  getPetProfileImageFile,
  getRequiredFormDataString,
  parsePetFormData,
  sanitizePetInput,
  validateActivePetBreed,
  validatePetProfileImageFile,
} from "./pet-action-helpers";
import {
  getPetProfileImageStorageKeyFromUrl,
  removePetProfileImagesFromStorage,
  uploadPetProfileImageToStorage,
} from "../utils/pet-profile-image-storage";

export async function createCustomerPet(
  formData: FormData,
): Promise<ActionResponse<null>> {
  let uploadedStorageKey: string | null = null;

  try {
    const customerId = await getCurrentCustomerId();

    if (!customerId.success) {
      return customerId;
    }

    const parsed = parsePetFormData(formData);

    if (!parsed.success) {
      return parsed;
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
      customerId: customerId.data,
      imageUrl: uploadedImage?.publicUrl ?? null,
      imageStorageKey: uploadedImage?.storageKey ?? null,
    });

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("createCustomerPet error:", error);

    if (uploadedStorageKey) {
      await removePetProfileImagesFromStorage([uploadedStorageKey]);
    }

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการสร้างสัตว์เลี้ยง",
    };
  }
}

export async function updateCustomerPet(
  formData: FormData,
): Promise<ActionResponse<null>> {
  let uploadedStorageKey: string | null = null;

  try {
    const customerId = await getCurrentCustomerId();

    if (!customerId.success) {
      return customerId;
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
      where: and(
        eq(pets.id, petId),
        eq(pets.customerId, customerId.data),
        isNull(pets.deletedAt),
      ),
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
      .where(
        and(
          eq(pets.id, petId),
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
    console.error("updateCustomerPet error:", error);

    if (uploadedStorageKey) {
      await removePetProfileImagesFromStorage([uploadedStorageKey]);
    }

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

    const currentPet = await db.query.pets.findFirst({
      columns: {
        id: true,
        imageUrl: true,
        imageStorageKey: true,
      },
      where: and(
        eq(pets.id, id),
        eq(pets.customerId, customerId.data),
        isNull(pets.deletedAt),
      ),
    });

    if (!currentPet) {
      return {
        success: false,
        error: "ไม่พบข้อมูลสัตว์เลี้ยงที่ต้องการลบ",
      };
    }

    const result = await db
      .update(pets)
      .set({
        deletedAt: new Date(),
        imageUrl: null,
        imageStorageKey: null,
      })
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

    const storageKey =
      currentPet.imageStorageKey ??
      getPetProfileImageStorageKeyFromUrl(currentPet.imageUrl);

    if (storageKey) {
      await removePetProfileImagesFromStorage([storageKey]);
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
