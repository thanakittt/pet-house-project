"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PencilIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PET_TYPE_LABELS } from "@/lib/constants/pet-type";
import { CreatePetBreedDialog } from "./CreatePetBreedDialog";
import { PetBreed } from "../types/pet-breed";
import { UpdatePetBreedDialog } from "./UpdatePetBreedDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { deletePetBreed } from "../actions/delete-pet-breed";

export function PetBreedManagement({ petBreeds }: { petBreeds: PetBreed[] }) {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPetBreed, setSelectedPetBreed] = useState<PetBreed | null>(
    null,
  );

  return (
    <>
      <div className="justify-between items-center gap-3 grid grid-cols-2 mb-5">
        <div className="flex items-center gap-3"></div>
        <div className="flex justify-end">
          <CreatePetBreedDialog />
        </div>
      </div>
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>ชื่อสายพันธุ์</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {petBreeds && petBreeds.length > 0 ? (
              petBreeds.map((petBreed) => (
                <TableRow key={petBreed.id}>
                  <TableCell>{petBreed.name}</TableCell>
                  <TableCell>
                    {PET_TYPE_LABELS[petBreed.type] || "อื่นๆ"}
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    {/* แก้ไขข้อมูลสายพันธุ์ */}
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="แก้ไขข้อมูล"
                      onClick={() => {
                        setSelectedPetBreed(petBreed);
                        setIsUpdateDialogOpen(true);
                      }}
                    >
                      <PencilIcon className="size-3.5" />
                    </Button>

                    {/* ลบข้อมูลสายพันธุ์ */}
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="ลบข้อมูล"
                      onClick={() => {
                        setSelectedPetBreed(petBreed);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <TrashIcon className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center">
                  ไม่มีข้อมูล
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedPetBreed && (
        <>
          <UpdatePetBreedDialog
            open={isUpdateDialogOpen}
            onOpenChange={setIsUpdateDialogOpen}
            petBreed={selectedPetBreed}
          />

          <ConfirmDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            title="ยืนยันการลบข้อมูลสายพันธุ์สัตว์เลี้ยง"
            description={`คุณต้องการลบข้อมูลสายพันธุ์สัตว์เลี้ยง "${selectedPetBreed.name}" หรือไม่?`}
            onConfirm={() => deletePetBreed({ id: selectedPetBreed.id })}
            successMessage="ลบข้อมูลสายพันธุ์เรียบร้อย"
            errorMessage="เกิดข้อผิดพลาดในการลบข้อมูลสายพันธุ์"
          />
        </>
      )}
    </>
  );
}

