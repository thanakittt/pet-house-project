"use client";

import { CreatePetDialog } from "@/modules/pet/components/CreatePetDialog";
import { PetAvatar } from "@/modules/pet/components/PetAvatar";
import type { Pet } from "@/modules/pet/types/pet";
import type { PetBreed } from "@/modules/pet-breed/types/pet-breed";
import { cn } from "@/lib/utils";
import { PlusCircle } from "lucide-react";
import type { FrontStoreFormData } from "./booking-utils";

interface PetCardProps {
  pet: Pet;
  onSelect: (pet: Pet) => void;
  isSelected?: boolean;
}

export function PetCard({ pet, onSelect, isSelected }: PetCardProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex flex-col gap-2 shadow-sm hover:shadow-md p-4 border rounded-lg text-left transition-colors cursor-pointer",
        isSelected
          ? "border-primary bg-muted dark:border-white"
          : "hover:bg-muted",
      )}
      onClick={() => onSelect(pet)}
    >
      <div className="flex flex-row items-start gap-4">
        <PetAvatar
          imageUrl={pet.imageUrl}
          name={pet.name}
          type={pet.breed.type}
        />
        <div className="flex flex-col w-full">
          <p className="font-bold text-base md:text-lg">{pet.name}</p>
          <div className="flex flex-row gap-2 text-muted-foreground text-sm">
            <p className="text-sm md:text-base">{pet.breed.name}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function Step1PetSelection({
  data,
  update,
  pets,
  petBreeds,
  customerId,
  unavailablePetIds = [],
}: {
  data: FrontStoreFormData;
  update: (data: FrontStoreFormData) => void;
  pets: Pet[];
  petBreeds: PetBreed[];
  customerId: string;
  unavailablePetIds?: string[];
}) {
  const unavailablePetIdSet = new Set(unavailablePetIds);
  const availablePets = pets.filter((pet) => !unavailablePetIdSet.has(pet.id));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-6">
        <h3 className="font-bold text-primary text-lg md:text-xl">
          ขั้นตอนที่ 1 : เลือกสัตว์เลี้ยง
        </h3>

        <div className="gap-4 grid grid-cols-1 sm:grid-cols-2">
          {availablePets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              onSelect={(selectedPet) =>
                update({
                  ...data,
                  petId: selectedPet.id,
                  mainServiceId: "",
                  addOnServiceIds: [],
                  startTimeIso: "",
                })
              }
              isSelected={data.petId === pet.id}
            />
          ))}

          <CreatePetDialog
            petBreeds={petBreeds}
            customerId={customerId}
            actionMode="customer"
            trigger={
              <button
                type="button"
                className="flex justify-center items-center hover:bg-muted p-4 border-2 border-dashed rounded-lg w-full min-h-[50px] cursor-pointer"
              >
                <div className="flex flex-col items-center gap-2 text-muted-foreground/70">
                  <PlusCircle className="size-5 md:size-6" />
                  <p className="font-semibold text-sm md:text-base">
                    เพิ่มสัตว์เลี้ยง
                  </p>
                </div>
              </button>
            }
          />
        </div>

        {pets.length === 0 ? (
          <div className="bg-muted/40 p-6 border border-dashed rounded-xl text-muted-foreground text-sm text-center">
            ยังไม่มีข้อมูลสัตว์เลี้ยงในโปรไฟล์ กรุณาเพิ่มสัตว์เลี้ยงก่อนจองคิว
          </div>
        ) : null}

        {pets.length > 0 && availablePets.length === 0 ? (
          <div className="bg-muted/40 p-6 border border-dashed rounded-xl text-muted-foreground text-sm text-center">
            ไม่มีสัตว์เลี้ยงที่ยังไม่ได้เพิ่มในรายการจอง
          </div>
        ) : null}
      </div>
    </div>
  );
}
