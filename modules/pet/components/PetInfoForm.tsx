"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PetCard } from "./PetCard";
import { CreatePetDialog } from "./CreatePetDialog";
import { PetBreed } from "@/modules/pet-breed/types/pet-breed";
import { Pet } from "../types/pet";
import { useState } from "react";
import { UpdatePetDialog } from "./UpdatePetDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { deletePet } from "../actions/delete-pet";

interface PetInfoFormProps {
  pets: Pet[];
  petBreeds: PetBreed[];
  customerId: string;
}

export function PetInfoForm({ pets, petBreeds, customerId }: PetInfoFormProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  return (
    <>
      <Card className="shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>ข้อมูลสัตว์เลี้ยง</CardTitle>
          <CreatePetDialog petBreeds={petBreeds} customerId={customerId} />
        </CardHeader>

        <CardContent className="p-6">
          {pets.length > 0 ? (
            <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
              {pets.map((pet) => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  onEdit={() => {
                    setSelectedPet(pet);
                    setIsEditOpen(true);
                  }}
                  onDelete={() => {
                    setSelectedPet(pet);
                    setIsDeleteOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 border-2 border-dashed rounded-xl text-center">
              <p className="text-muted-foreground">
                ยังไม่มีข้อมูลสัตว์เลี้ยงในระบบ
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPet && (
        <>
          <UpdatePetDialog
            petBreeds={petBreeds}
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            pet={selectedPet}
          />
          <ConfirmDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            title="ยืนยันการลบข้อมูลสัตว์เลี้ยง"
            description={`คุณต้องการลบข้อมูลสัตว์เลี้ยง "${selectedPet.name}" หรือไม่?`}
            onConfirm={() => deletePet({ id: selectedPet.id })}
            successMessage="ลบข้อมูลสัตว์เลี้ยงเรียบร้อย"
            errorMessage="เกิดข้อผิดพลาดในการลบข้อมูลสัตว์เลี้ยง"
          />
        </>
      )}
    </>
  );
}
