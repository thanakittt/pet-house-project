"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PetBreed } from "@/modules/pet-breed/types/pet-breed";
import { useState } from "react";
import { deleteCustomerPet } from "../actions/customer-pet";
import { deletePet } from "../actions/delete-pet";
import { Pet } from "../types/pet";
import { CreatePetDialog } from "./CreatePetDialog";
import { PetCard } from "./PetCard";
import { UpdatePetDialog } from "./UpdatePetDialog";
import { PawPrintIcon } from "lucide-react";
import { DESKTOP_ONLY_CONTAINER_CLASS } from "@/components/shared/TableActionButton";

type PetActionMode = "staff" | "customer";

interface PetInfoFormProps {
  pets: Pet[];
  petBreeds: PetBreed[];
  customerId: string;
  actionMode?: PetActionMode;
}

export function PetInfoForm({
  pets,
  petBreeds,
  customerId,
  actionMode = "staff",
}: PetInfoFormProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  const emptyStateMessage =
    actionMode === "customer"
      ? "ยังไม่มีข้อมูลสัตว์เลี้ยงในโปรไฟล์ของคุณ"
      : "ยังไม่มีข้อมูลสัตว์เลี้ยงในระบบ";
  const shouldShowHeaderCreateButton = pets.length > 0 || actionMode === "staff";
  const shouldUseDesktopOnlyActions = actionMode === "staff";

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="flex flex-row items-center gap-2 text-lg font-bold">
            <PawPrintIcon size={18} className="text-taupe-600 rounded-lg bg-taupe-100 p-1.5 w-8 h-8 mr-1" />
            ข้อมูลสัตว์เลี้ยง
          </CardTitle>
          {shouldShowHeaderCreateButton && (
            <div
              className={
                shouldUseDesktopOnlyActions
                  ? DESKTOP_ONLY_CONTAINER_CLASS
                  : undefined
              }
            >
              <CreatePetDialog
                petBreeds={petBreeds}
                customerId={customerId}
                actionMode={actionMode}
              />
            </div>
          )}
        </CardHeader>

        <CardContent className="px-6 py-2">
          {pets.length > 0 ? (
            <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
              {pets.map((pet) => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  desktopOnlyActions={shouldUseDesktopOnlyActions}
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
            <div className="flex flex-col items-center gap-4 py-12 border-2 border-dashed rounded-xl text-center">
              <p className="text-muted-foreground">{emptyStateMessage}</p>
              {actionMode === "customer" && (
                <CreatePetDialog
                  petBreeds={petBreeds}
                  customerId={customerId}
                  actionMode={actionMode}
                />
              )}
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
            actionMode={actionMode}
          />
          <ConfirmDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            title="ยืนยันการลบข้อมูลสัตว์เลี้ยง"
            description={`คุณต้องการลบข้อมูลสัตว์เลี้ยง "${selectedPet.name}" หรือไม่?`}
            onConfirm={() =>
              actionMode === "customer"
                ? deleteCustomerPet({ id: selectedPet.id })
                : deletePet({ id: selectedPet.id })
            }
            successMessage="ลบข้อมูลสัตว์เลี้ยงเรียบร้อย"
            errorMessage="เกิดข้อผิดพลาดในการลบข้อมูลสัตว์เลี้ยง"
            mode="delete"
          />
        </>
      )}
    </>
  );
}
