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
import { CreateInventoryCategoryDialog } from "./CreateInventoryCategoryDialog";
import { InventoryCategory } from "../types/inventory-category";
import { UpdateInventoryCategoryDialog } from "./UpdateInventoryCategoryDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { deleteInventoryCategory } from "../actions/delete-inventory-category";

export function InventoryCategoryManagement({
  inventoryCategories,
}: {
  inventoryCategories: InventoryCategory[];
}) {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInventoryCategory, setSelectedInventoryCategory] =
    useState<InventoryCategory | null>(null);

  return (
    <>
      <div className="justify-between items-center gap-3 grid grid-cols-2 mb-5">
        <div className="flex items-center gap-3"></div>
        <div className="flex justify-end">
          <CreateInventoryCategoryDialog />
        </div>
      </div>
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>ชื่อหมวดหมู่</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventoryCategories && inventoryCategories.length > 0 ? (
              inventoryCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    {/* แก้ไขข้อมูลหมวดหมู่ */}
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="แก้ไขข้อมูล"
                      onClick={() => {
                        setSelectedInventoryCategory(category);
                        setIsUpdateDialogOpen(true);
                      }}
                    >
                      <PencilIcon className="size-3.5" />
                    </Button>

                    {/* ลบข้อมูลหมวดหมู่ */}
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="ลบข้อมูล"
                      onClick={() => {
                        setSelectedInventoryCategory(category);
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
                <TableCell colSpan={2} className="py-10 text-center">
                  ไม่มีข้อมูล
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
          />
        </>
      )}
    </>
  );
}
