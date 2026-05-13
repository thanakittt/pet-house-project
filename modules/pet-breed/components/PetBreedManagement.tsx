"use client";

import {
  ManagementListControls,
  ManagementPagination,
  type ManagementFilterOption,
} from "@/components/shared/ManagementListControls";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableActionButton } from "@/components/shared/TableActionButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PET_TYPE_LABELS, PET_TYPE_OPTIONS } from "@/lib/constants/pet-type";
import {
  PET_SIZE_LABELS,
  PET_SIZE_OPTIONS,
} from "@/lib/constants/service-type";
import { useState } from "react";
import { deletePetBreed } from "../actions/delete-pet-breed";
import type { ListPetBreedsResult } from "../queries/list-pet-breeds";
import { PetBreed } from "../types/pet-breed";
import { CreatePetBreedDialog } from "./CreatePetBreedDialog";
import { UpdatePetBreedDialog } from "./UpdatePetBreedDialog";

const typeOptions: ManagementFilterOption[] = [
  { value: "ALL", label: "ทุกประเภท" },
  ...PET_TYPE_OPTIONS,
];

const sizeOptions: ManagementFilterOption[] = [
  { value: "ALL", label: "ทุกขนาด" },
  ...PET_SIZE_OPTIONS.filter((option) => option.value !== "ALL"),
];

export function PetBreedManagement({
  petBreeds,
  total,
  page,
  pageSize,
  totalPages,
  q,
  size,
  type,
}: ListPetBreedsResult) {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPetBreed, setSelectedPetBreed] = useState<PetBreed | null>(
    null,
  );

  return (
    <>
      <ManagementListControls
        search={{
          ariaLabel: "ค้นหาสายพันธุ์",
          placeholder: "ค้นหาชื่อสายพันธุ์",
          value: q,
        }}
        selectFilters={[
          {
            ariaLabel: "กรองประเภทสัตว์เลี้ยง",
            name: "type",
            options: typeOptions,
            placeholder: "ประเภท",
            value: type,
          },
          {
            ariaLabel: "กรองขนาดสัตว์เลี้ยง",
            name: "size",
            options: sizeOptions,
            placeholder: "ขนาด",
            value: size,
          },
        ]}
        createAction={<CreatePetBreedDialog />}
      />

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>ชื่อสายพันธุ์</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead>ขนาด</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {petBreeds.length > 0 ? (
              petBreeds.map((petBreed) => (
                <TableRow key={petBreed.id}>
                  <TableCell>{petBreed.name}</TableCell>
                  <TableCell>
                    {PET_TYPE_LABELS[petBreed.type] || "อื่นๆ"}
                  </TableCell>
                  <TableCell>
                    {PET_SIZE_LABELS[petBreed.size] || petBreed.size}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <TableActionButton
                        aria-label="แก้ไขข้อมูล"
                        action="edit"
                        onClick={() => {
                          setSelectedPetBreed(petBreed);
                          setIsUpdateDialogOpen(true);
                        }}
                      />

                      <TableActionButton
                        aria-label="ลบข้อมูล"
                        action="delete"
                        onClick={() => {
                          setSelectedPetBreed(petBreed);
                          setIsDeleteDialogOpen(true);
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center">
                  ไม่พบข้อมูลสายพันธุ์สัตว์เลี้ยง
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ManagementPagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
      />

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
            mode="delete"
          />
        </>
      )}
    </>
  );
}
