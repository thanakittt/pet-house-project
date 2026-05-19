"use client";

import PetTypeBadge from "@/modules/pet/components/PetTypeBadge";
import type { Pet } from "@/modules/pet/types/pet";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
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
      className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-4 text-left shadow-sm transition-colors hover:shadow-md ${isSelected ? "border-black bg-muted" : "hover:bg-muted"
        }`}
      onClick={() => onSelect(pet)}
    >
      <div className="flex flex-row items-start gap-4">
        <PetTypeBadge
          type={pet.breed.type.toLowerCase()}
          className="px-3 py-6 rounded-xl"
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
}: {
  data: FrontStoreFormData;
  update: (data: FrontStoreFormData) => void;
  pets: Pet[];
}) {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-6">
        <h3 className="font-bold text-primary text-lg md:text-xl">
          ขั้นตอนที่ 1 : เลือกสัตว์เลี้ยง
        </h3>

        <div className="gap-4 grid grid-cols-1 sm:grid-cols-2">
          {pets.map((pet) => (
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

          <Link href="/pets">
            <div className="flex justify-center items-center hover:bg-muted p-4 border-2 border-dashed rounded-lg min-h-[50px] cursor-pointer">
              <div className="flex flex-col items-center gap-2 text-muted-foreground/70">
                <PlusCircle className="size-5 md:size-6" />
                <p className="font-semibold text-sm md:text-base">
                  เพิ่มสัตว์เลี้ยง
                </p>
              </div>
            </div>
          </Link>
        </div>

        {pets.length === 0 ? (
          <div className="bg-muted/40 p-6 border border-dashed rounded-xl text-muted-foreground text-sm text-center">
            ยังไม่มีข้อมูลสัตว์เลี้ยงในโปรไฟล์ กรุณาเพิ่มสัตว์เลี้ยงก่อนจองคิว
          </div>
        ) : null}
      </div>
    </div>
  );
}
