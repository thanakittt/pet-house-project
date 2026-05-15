"use client";

import BackButton from "@/components/BackButton";
import {
  ManagementListControls,
  ManagementPagination,
  type ManagementFilterOption,
} from "@/components/shared/ManagementListControls";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PetTypeBadge } from "@/components/shared/PetTypeBadge";
import { TableActionButton } from "@/components/shared/TableActionButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PET_TYPE_OPTIONS } from "@/lib/constants/pet-type";
import {
  PET_SIZE_LABELS,
  PET_SIZE_OPTIONS,
} from "@/lib/constants/service-type";
import { useState } from "react";
import { deleteServiceVariant } from "../actions/delete-service-variant";
import type { GetServiceVariantsResult } from "../queries/get-service";
import { ServiceVariant } from "../types/service-variant";
import { CreateServiceVariantDialog } from "./CreateServiceVariantDialog";
import { UpdateServiceVariantDialog } from "./UpdateServiceVariantDialog";

const petTypeOptions: ManagementFilterOption[] = [
  { value: "ALL", label: "ทุกประเภท" },
  ...PET_TYPE_OPTIONS,
];

const sizeOptions: ManagementFilterOption[] = [
  { value: "ALL", label: "ทุกขนาด" },
  ...PET_SIZE_OPTIONS.filter((option) => option.value !== "ALL"),
];

type ServiceVariantsManagementProps = GetServiceVariantsResult & {
  backHref: string;
  serviceId: string;
};

export default function ServiceVariantsManagement({
  backHref,
  serviceId,
  variants,
  total,
  page,
  pageSize,
  totalPages,
  petType,
  size,
}: ServiceVariantsManagementProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ServiceVariant | null>(
    null,
  );

  return (
    <>
      <BackButton href={backHref} />

      <ManagementListControls
        selectFilters={[
          {
            ariaLabel: "กรองประเภทสัตว์เลี้ยง",
            name: "petType",
            options: petTypeOptions,
            placeholder: "สัตว์เลี้ยง",
            value: petType,
          },
          {
            ariaLabel: "กรองขนาดสัตว์เลี้ยง",
            name: "size",
            options: sizeOptions,
            placeholder: "ขนาด",
            value: size,
          },
        ]}
        createAction={<CreateServiceVariantDialog serviceId={serviceId} />}
        createActionDesktopOnly
      />

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>สัตว์เลี้ยง</TableHead>
              <TableHead>ขนาด</TableHead>
              <TableHead>ราคา (บาท)</TableHead>
              <TableHead>เวลา (นาที)</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.length > 0 ? (
              variants.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell>
                    <PetTypeBadge type={variant.petType} />
                  </TableCell>
                  <TableCell>
                    {PET_SIZE_LABELS[variant.size] || variant.size}
                  </TableCell>
                  <TableCell>
                    {variant.isStartingPriceOnly
                      ? variant.minPrice
                      : `${variant.minPrice} - ${variant.maxPrice}`}
                  </TableCell>
                  <TableCell>{variant.durationMinutes}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <TableActionButton
                        aria-label="แก้ไขข้อมูล"
                        action="edit"
                        desktopOnly
                        onClick={() => {
                          setSelectedVariant(variant);
                          setIsEditDialogOpen(true);
                        }}
                      />

                      <TableActionButton
                        aria-label="ลบข้อมูล"
                        action="delete"
                        desktopOnly
                        onClick={() => {
                          setSelectedVariant(variant);
                          setIsDeleteDialogOpen(true);
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  ไม่พบข้อมูลตัวเลือกบริการ
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

      {selectedVariant && (
        <>
          <UpdateServiceVariantDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            serviceVariant={selectedVariant}
          />
          <ConfirmDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            title="ยืนยันการลบข้อมูลตัวเลือกบริการ"
            description="คุณต้องการลบข้อมูลตัวเลือกบริการหรือไม่?"
            onConfirm={() => deleteServiceVariant({ id: selectedVariant.id })}
            successMessage="ลบข้อมูลตัวเลือกบริการเรียบร้อย"
            errorMessage="เกิดข้อผิดพลาดในการลบข้อมูลตัวเลือกบริการ"
            mode="delete"
          />
        </>
      )}
    </>
  );
}
