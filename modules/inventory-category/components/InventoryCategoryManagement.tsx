"use client";

import {
  ManagementListControls,
  ManagementPagination,
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
import { useState } from "react";
import { deleteInventoryCategory } from "../actions/delete-inventory-category";
import type { ListInventoryCategoriesResult } from "../queries/list-inventory-categories";
import { InventoryCategory } from "../types/inventory-category";
import { CreateInventoryCategoryDialog } from "./CreateInventoryCategoryDialog";
import { UpdateInventoryCategoryDialog } from "./UpdateInventoryCategoryDialog";

export function InventoryCategoryManagement({
  inventoryCategories,
  total,
  page,
  pageSize,
  totalPages,
  q,
}: ListInventoryCategoriesResult) {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInventoryCategory, setSelectedInventoryCategory] =
    useState<InventoryCategory | null>(null);

  return (
    <>
      <ManagementListControls
        search={{
          ariaLabel: "ค้นหาหมวดหมู่สินค้า",
          placeholder: "ค้นหาชื่อหมวดหมู่",
          value: q,
        }}
        createAction={<CreateInventoryCategoryDialog />}
        createActionDesktopOnly
      />

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>ชื่อหมวดหมู่</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventoryCategories.length > 0 ? (
              inventoryCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <TableActionButton
                        aria-label="แก้ไขข้อมูล"
                        action="edit"
                        desktopOnly
                        onClick={() => {
                          setSelectedInventoryCategory(category);
                          setIsUpdateDialogOpen(true);
                        }}
                      />

                      <TableActionButton
                        aria-label="ลบข้อมูล"
                        action="delete"
                        desktopOnly
                        onClick={() => {
                          setSelectedInventoryCategory(category);
                          setIsDeleteDialogOpen(true);
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="py-10 text-center">
                  ไม่พบข้อมูลหมวดหมู่สินค้า
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

      {selectedInventoryCategory && (
        <>
          <UpdateInventoryCategoryDialog
            open={isUpdateDialogOpen}
            onOpenChange={setIsUpdateDialogOpen}
            inventoryCategory={selectedInventoryCategory}
          />

          <ConfirmDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            title="ยืนยันการลบข้อมูลหมวดหมู่สินค้า"
            description={`คุณต้องการลบข้อมูลหมวดหมู่สินค้า "${selectedInventoryCategory.name}" หรือไม่?`}
            onConfirm={() =>
              deleteInventoryCategory({ id: selectedInventoryCategory.id })
            }
            successMessage="ลบข้อมูลหมวดหมู่สินค้าเรียบร้อย"
            errorMessage="เกิดข้อผิดพลาดในการลบข้อมูลหมวดหมู่สินค้า"
            mode="delete"
          />
        </>
      )}
    </>
  );
}
