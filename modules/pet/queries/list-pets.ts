"use server";

import { db } from "@/db";
import { pets } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { ActionResponse } from "@/types/action";
import { Pet } from "../types/pet";

export async function listPets(customerId: string): Promise<ActionResponse<Pet[]>> {
  try {
    const petsData = await db.query.pets.findMany({
      with: {
        breed: {
          columns: {
            name: true,
            id: true,
            type: true,
            size: true,
          },
        },
      },
      columns: {
        id: true,
        name: true,
        medicalNotes: true,
        petBreedId: true,
      },
      where: and(eq(pets.customerId, customerId), isNull(pets.deletedAt)),
    });
    return {
      success: true,
      data: petsData,
    };
  } catch (error) {
    console.error("listPets error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลสัตว์เลี้ยง",
    };
  }
}
