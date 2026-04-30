"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableActionButton } from "@/components/shared/TableActionButton";
import { useState } from "react";
import { PET_TYPE_LABELS } from "@/lib/constants/pet-type";
import { PET_SIZE_LABELS } from "@/lib/constants/service-type";
import { CreateServiceVariantDialog } from "./CreateServiceVariantDialog";
import { ServiceVariant } from "../types/service-variant";
import { UpdateServiceVariantDialog } from "./UpdateServiceVariantDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { deleteServiceVariant } from "../actions/delete-service-variant";
import BackButton from "@/components/BackButton";

interface ServiceVariantsManagementProps {
  serviceId: string;
  variants: ServiceVariant[];
}

export default function ServiceVariantsManagement({
  serviceId,
  variants,
}: ServiceVariantsManagementProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ServiceVariant | null>(
    null,
  );

  return (
    <>
      <div className="flex justify-between items-center gap-3 mb-5">
        <BackButton />
        <CreateServiceVariantDialog serviceId={serviceId} />
      </div>
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
            {variants && variants.length > 0 ? (
              variants.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell>
                    {PET_TYPE_LABELS[variant.petType] || variant.petType}
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
                    {/* แก้ไขข้อมูลตัวเลือกบริการ */}
                    <TableActionButton
                      aria-label="แก้ไขข้อมูล"
                      action="edit"
                      onClick={() => {
                        setSelectedVariant(variant);
                        setIsEditDialogOpen(true);
                      }}
                    />

                    {/* ลบข้อมูลตัวเลือกบริการ */}
                    <TableActionButton
                      aria-label="ลบข้อมูล"
                      action="delete"
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
                  ไม่มีข้อมูล
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
          />
        </>
      )}
    </>
  );
}
