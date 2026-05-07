import { db } from "@/db";
import { petBreeds } from "@/db/schema";
import { requireCustomer } from "@/lib/session";
import { getCustomerProfile } from "@/modules/customer/queries/get-profile";
import { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";

type PetInput = {
  name: string;
  medicalNotes: string;
  petBreedId: string;
};

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
