"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TableActionButton,
  TableActionLink,
  TABLE_ACTION_ICONS,
} from "@/components/shared/TableActionButton";
import { useState } from "react";
import { SERVICE_TYPE_LABELS } from "@/lib/constants/service-type";
import { CreateServiceDialog } from "./CreateServiceDialog";
import { Service } from "../types/service";
import { UpdateServiceDialog } from "./UpdateServiceDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { deleteService } from "../actions/delete-service";

interface ServiceManagementProps {
  services: Service[];
}

/** คอมโพเนนต์จัดการบริการ — แสดงตาราง + CRUD actions */
export default function ServiceManagement({ services }: ServiceManagementProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  return (
    <>
      <div className="justify-between items-center gap-3 grid grid-cols-2 mb-5">
        <div className="flex items-center gap-3"></div>
        <div className="flex justify-end">
          <CreateServiceDialog />
        </div>
      </div>
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>ชื่อบริการ</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead>คำอธิบาย</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services && services.length > 0 ? (
              services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{service.name}</TableCell>
                  <TableCell>
                    {SERVICE_TYPE_LABELS[service.serviceType] || "อื่นๆ"}
                  </TableCell>
                  <TableCell>{service.description || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                    {/* จัดการตัวเลือกบริการ */}
                    <TableActionLink
                      aria-label="จัดการตัวเลือกบริการ"
                      href={`/back-office/services/${service.id}/variants`}
                      icon={TABLE_ACTION_ICONS.manage}
                    />

                    {/* แก้ไขข้อมูลบริการ */}
                    <TableActionButton
                      aria-label="แก้ไขข้อมูล"
                      icon={TABLE_ACTION_ICONS.edit}
                      onClick={() => {
                        setSelectedService(service);
                        setIsEditDialogOpen(true);
                      }}
                    />

                    {/* ลบข้อมูลบริการ */}
                    <TableActionButton
                      aria-label="ลบข้อมูล"
                      icon={TABLE_ACTION_ICONS.delete}
                      onClick={() => {
                        setSelectedService(service);
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
                  ไม่มีข้อมูล
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedService && (
        <>
          <UpdateServiceDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            service={selectedService}
          />
          <ConfirmDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            title="ยืนยันการลบข้อมูลบริการ"
            description={`คุณต้องการลบข้อมูลบริการ "${selectedService.name}" หรือไม่?`}
            onConfirm={() => deleteService({ id: selectedService.id })}
            successMessage="ลบข้อมูลบริการเรียบร้อย"
            errorMessage="เกิดข้อผิดพลาดในการลบข้อมูลบริการ"
          />
        </>
      )}
    </>
  );
}

