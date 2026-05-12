"use client";

import {
  ManagementListControls,
  ManagementPagination,
  type ManagementFilterOption,
} from "@/components/shared/ManagementListControls";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  TableActionButton,
  TableActionLink,
} from "@/components/shared/TableActionButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_OPTIONS,
} from "@/lib/constants/service-type";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { deleteService } from "../actions/delete-service";
import type { ListServicesResult } from "../queries/list-services";
import { Service } from "../types/service";
import { CreateServiceDialog } from "./CreateServiceDialog";
import { UpdateServiceDialog } from "./UpdateServiceDialog";

const serviceTypeOptions: ManagementFilterOption[] = [
  { value: "ALL", label: "ทุกประเภท" },
  ...SERVICE_TYPE_OPTIONS,
];

export default function ServiceManagement({
  services,
  total,
  page,
  pageSize,
  totalPages,
  q,
  type,
}: ListServicesResult) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const currentQuery = searchParams.toString();
  const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;

  return (
    <>
      <ManagementListControls
        search={{
          ariaLabel: "ค้นหาบริการ",
          placeholder: "ค้นหาชื่อบริการหรือคำอธิบาย",
          value: q,
        }}
        selectFilters={[
          {
            ariaLabel: "กรองประเภทบริการ",
            name: "type",
            options: serviceTypeOptions,
            placeholder: "ประเภท",
            value: type,
          },
        ]}
        createAction={<CreateServiceDialog />}
      />

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
            {services.length > 0 ? (
              services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{service.name}</TableCell>
                  <TableCell>
                    {SERVICE_TYPE_LABELS[service.serviceType] || "อื่นๆ"}
                  </TableCell>
                  <TableCell>{service.description || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <TableActionLink
                        aria-label="จัดการตัวเลือกบริการ"
                        action="manage"
                        href={`/back-office/services/${service.id}/variants?from=${encodeURIComponent(currentUrl)}`}
                      />

                      <TableActionButton
                        aria-label="แก้ไขข้อมูล"
                        action="edit"
                        onClick={() => {
                          setSelectedService(service);
                          setIsEditDialogOpen(true);
                        }}
                      />

                      <TableActionButton
                        aria-label="ลบข้อมูล"
                        action="delete"
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
                  ไม่พบข้อมูลบริการ
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
