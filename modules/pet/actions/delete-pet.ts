"use server";

import { db } from "@/db";
import { pets } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { and, eq, isNull } from "drizzle-orm";
import {
  getPetProfileImageStorageKeyFromUrl,
  removePetProfileImagesFromStorage,
} from "../utils/pet-profile-image-storage";

export async function deletePet({ id }: { id: string }) {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "ไม่มีสิทธิ์ลบข้อมูลสัตว์เลี้ยง",
      };
    }

    const currentPet = await db.query.pets.findFirst({
      columns: {
        id: true,
        imageUrl: true,
        imageStorageKey: true,
      },
      where: and(eq(pets.id, id), isNull(pets.deletedAt)),
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
      .where(and(eq(pets.id, id), isNull(pets.deletedAt)))
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

    return { success: true, data: null };
  } catch (error) {
    console.error("deletePet error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการลบข้อมูลสัตว์เลี้ยง",
    };
  }
}
