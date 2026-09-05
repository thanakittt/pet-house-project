"use client";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  ManagementListControls,
  ManagementPagination,
} from "@/components/shared/ManagementListControls";
import { TableActionButton } from "@/components/shared/TableActionButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, Power, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteVendor } from "../actions/delete-vendor";
import { toggleVendorStatus } from "../actions/toggle-vendor-status";
import type { ListVendorsResult } from "../queries/list-vendors";
import { Vendor } from "../types/vendor";
import { CreateVendorDialog } from "./CreateVendorDialog";
import { UpdateVendorDialog } from "./UpdateVendorDialog";

export function VendorManagement({
  vendors,
  total,
  page,
  pageSize,
  totalPages,
  q,
  status,
}: ListVendorsResult) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const handleToggleStatus = (vendor: Vendor) => {
    startTransition(async () => {
      const nextStatus = !vendor.isActive;
      const result = await toggleVendorStatus({
        id: vendor.id,
        isActive: nextStatus,
      });

      if (!result.success) {
        toast.error(result.error || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
        return;
      }

      toast.success(
        `เปลี่ยนสถานะเป็น "${nextStatus ? "เปิดใช้งาน" : "ปิดใช้งาน"}" สำเร็จ`,
      );
      router.refresh();
    });
  };

  return (
    <>
      <ManagementListControls
        search={{
          ariaLabel: "ค้นหาผู้จำหน่าย",
          placeholder: "ค้นหาชื่อ, ผู้ติดต่อ, เบอร์โทร, เลขผู้เสียภาษี",
          value: q,
        }}
        selectFilters={[
          {
            ariaLabel: "กรองตามสถานะ",
            name: "status",
            placeholder: "สถานะทั้งหมด",
            value: status,
            options: [
              { label: "สถานะทั้งหมด", value: "ALL" },
              { label: "เปิดใช้งาน", value: "active" },
              { label: "ปิดใช้งาน", value: "inactive" },
            ],
          },
        ]}
        createAction={<CreateVendorDialog />}
        createActionDesktopOnly
      />

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="min-w-[180px]">ชื่อผู้จำหน่าย</TableHead>
              <TableHead className="min-w-[140px]">ผู้ติดต่อ</TableHead>
              <TableHead className="min-w-[140px]">เบอร์โทร / อีเมล</TableHead>
              <TableHead className="min-w-[140px]">เลขผู้เสียภาษี</TableHead>
              <TableHead className="text-center min-w-[120px]">สถานะ</TableHead>
              <TableHead className="text-right min-w-[100px]">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.length > 0 ? (
              vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <div className="font-semibold text-foreground">
                      {vendor.name}
                    </div>
                    {vendor.address && (
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-[280px]">
                        {vendor.address}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {vendor.contactName ? (
                      <span className="text-sm">{vendor.contactName}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      {vendor.phone && (
                        <div className="text-sm font-mono">{vendor.phone}</div>
                      )}
                      {vendor.email && (
                        <div className="text-xs text-muted-foreground">
                          {vendor.email}
                        </div>
                      )}
                      {!vendor.phone && !vendor.email && (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {vendor.taxId ? (
                      <span className="font-mono text-sm">{vendor.taxId}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 cursor-pointer gap-1.5 hover:bg-muted/80"
                      onClick={() => handleToggleStatus(vendor)}
                      title="กดเพื่อสลับสถานะเปิด/ปิดการใช้งาน"
                    >
                      {vendor.isActive ? (
                        <Badge
                          variant="default"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        >
                          <CheckCircle2 className="size-3" /> เปิดใช้งาน
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="size-3 text-muted-foreground" />{" "}
                          ปิดใช้งาน
                        </Badge>
                      )}
                      <Power className="size-3.5 text-muted-foreground/70" />
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <TableActionButton
                        aria-label="แก้ไขข้อมูล"
                        action="edit"
                        desktopOnly
                        onClick={() => {
                          setSelectedVendor(vendor);
                          setIsUpdateDialogOpen(true);
                        }}
                      />

                      <TableActionButton
                        aria-label="ลบข้อมูล"
                        action="delete"
                        desktopOnly
                        onClick={() => {
                          setSelectedVendor(vendor);
                          setIsDeleteDialogOpen(true);
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  ไม่พบข้อมูลผู้จำหน่าย
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

      {selectedVendor && (
        <>
          <UpdateVendorDialog
            open={isUpdateDialogOpen}
            onOpenChange={setIsUpdateDialogOpen}
            vendor={selectedVendor}
          />

          <ConfirmDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            title="ยืนยันการลบข้อมูลผู้จำหน่าย"
            description={`คุณต้องการลบข้อมูลผู้จำหน่าย "${selectedVendor.name}" หรือไม่? ข้อมูลนี้จะถูกนำออกจากระบบ (Soft Delete)`}
            onConfirm={() => deleteVendor({ id: selectedVendor.id })}
            successMessage="ลบข้อมูลผู้จำหน่ายเรียบร้อยแล้ว"
            errorMessage="เกิดข้อผิดพลาดในการลบข้อมูลผู้จำหน่าย"
            mode="delete"
          />
        </>
      )}
    </>
  );
}
