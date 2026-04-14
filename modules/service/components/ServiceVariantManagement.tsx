"use client";
// Separator ถูกลบออกเนื่องจากไม่ได้ใช้งานใน JSX ของคอมโพเนนต์นี้
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Settings icon ถูกลบออก — ไม่มีปุ่มจัดการ settings ใน ServiceVariant management
import { PencilIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";
import { PET_TYPE_LABELS } from "@/lib/constants/pet-type";
import { PET_SIZE_LABELS } from "@/lib/constants/service-type";
import { CreateServiceVariantDialog } from "./CreateServiceVariantDialog";
import { ServiceVariant } from "../types/service-variant";
import { UpdateServiceVariantDialog } from "./UpdateServiceVariantDialog";
import { DeleteServiceVariantDialog } from "./DeleteServiceVariantDialog";

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
        <Button variant="ghost" asChild>
          <Link href="/services">กลับ</Link>
        </Button>
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
                  <TableCell className="space-x-2 text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="แก้ไขข้อมูล"
                      onClick={() => {
                        setSelectedVariant(variant);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <PencilIcon className="size-3.5" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="ลบข้อมูล"
                      onClick={() => {
                        setSelectedVariant(variant);
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
          <DeleteServiceVariantDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            serviceVariantId={selectedVariant.id}
          />
        </>
      )}
    </>
  );
}
