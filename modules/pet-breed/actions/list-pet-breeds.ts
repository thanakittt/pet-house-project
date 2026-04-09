"use server";

import { db } from "@/db";
import { petBreeds } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { isNull } from "drizzle-orm";
import { PetBreed } from "../types/pet-breed";



export async function listPetBreeds(): Promise<ActionResponse<PetBreed[]>> {
  try {
    const breeds = await db
      .select({
        id: petBreeds.id,
        name: petBreeds.name,
        type: petBreeds.type,
      })
      .from(petBreeds)
      .where(isNull(petBreeds.deletedAt));
    return {
      success: true,
      data: breeds,
    };
  } catch (error) {
    console.log("listPetBreeds error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลสายพันธุ์สัตว์เลี้ยง",
    };
  }
}
