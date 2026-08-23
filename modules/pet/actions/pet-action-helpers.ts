import { db } from "@/db";
import { petBreeds } from "@/db/schema";
import { requireCustomer } from "@/lib/session";
import { getCustomerProfile } from "@/modules/customer/queries/get-profile";
import { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";
import {
  isAllowedPetProfileImageMimeType,
  MAX_PET_PROFILE_IMAGE_SIZE_BYTES,
} from "../utils/pet-profile-image-storage";

type PetInput = {
  name: string;
  medicalNotes: string;
  petBreedId: string;
};

export type ParsedPetFormData = PetInput;

export type SanitizedPetInput = {
  name: string;
  medicalNotes: string | null;
  petBreedId: string;
};

export function sanitizePetInput(
  data: PetInput,
): ActionResponse<SanitizedPetInput> {
  const name = data.name.trim();
  const medicalNotes = data.medicalNotes.trim();
  const petBreedId = data.petBreedId.trim();

  if (!name) {
    return {
      success: false,
      error: "กรุณาระบุชื่อสัตว์เลี้ยง",
    };
  }

  if (name.length > 100) {
    return {
      success: false,
      error: "ชื่อสัตว์เลี้ยงไม่เกิน 100 ตัวอักษร",
    };
  }

  if (!petBreedId) {
    return {
      success: false,
      error: "กรุณาระบุพันธุ์สัตว์เลี้ยง",
    };
  }

  if (medicalNotes.length > 500) {
    return {
      success: false,
      error: "ข้อมูลการแพ้ / โรคประจำตัวไม่เกิน 500 ตัวอักษร",
    };
  }

  return {
    success: true,
    data: {
      name,
      medicalNotes: medicalNotes || null,
      petBreedId,
    },
  };
}

export async function validateActivePetBreed(
  petBreedId: string,
): Promise<ActionResponse<null>> {
  const activeBreed = await db.query.petBreeds.findFirst({
    columns: {
      id: true,
    },
    where: and(eq(petBreeds.id, petBreedId), isNull(petBreeds.deletedAt)),
  });

  if (!activeBreed) {
    return {
      success: false,
      error: "ไม่พบข้อมูลสายพันธุ์สัตว์เลี้ยง หรือสายพันธุ์ถูกลบไปแล้ว",
    };
  }

  return {
    success: true,
    data: null,
  };
}

export async function getCurrentCustomerId(): Promise<ActionResponse<string>> {
  const session = await requireCustomer({ redirect: false });

  if (!session) {
    return {
      success: false,
      error: "กรุณาเข้าสู่ระบบก่อนจัดการข้อมูลสัตว์เลี้ยง",
    };
  }

  const profile = await getCustomerProfile(session.user);

  if (!profile.success) {
    return {
      success: false,
      error: profile.error,
    };
  }

  if (!profile.data) {
    return {
      success: false,
      error: "กรุณาตั้งค่าโปรไฟล์ลูกค้าก่อนจัดการข้อมูลสัตว์เลี้ยง",
    };
  }

  return {
    success: true,
    data: profile.data.customerId,
  };
}

export function parsePetFormData(
  formData: FormData,
): ActionResponse<ParsedPetFormData> {
  const name = getRequiredFormDataString(formData, "name");
  const medicalNotes = getRequiredFormDataString(formData, "medicalNotes");
  const petBreedId = getRequiredFormDataString(formData, "petBreedId");

  if (name === null || medicalNotes === null || petBreedId === null) {
    return {
      success: false,
      error: "ข้อมูลสัตว์เลี้ยงไม่ถูกต้อง",
    };
  }

  return {
    success: true,
    data: {
      name,
      medicalNotes,
      petBreedId,
    },
  };
}

export function getRequiredFormDataString(
  formData: FormData,
  key: string,
): string | null {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  return value;
}

export function getPetProfileImageFile(formData: FormData): File | null {
  const value = formData.get("petImage");

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

export function validatePetProfileImageFile(
  imageFile: File | null,
): ActionResponse<null> {
  if (!imageFile) {
    return {
      success: true,
      data: null,
    };
  }

  if (!isAllowedPetProfileImageMimeType(imageFile.type)) {
    return {
      success: false,
      error: "รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP",
    };
  }

  if (imageFile.size > MAX_PET_PROFILE_IMAGE_SIZE_BYTES) {
    return {
      success: false,
      error: "ขนาดรูปภาพต้องไม่เกิน 4MB",
    };
  }

  return {
    success: true,
    data: null,
  };
}
