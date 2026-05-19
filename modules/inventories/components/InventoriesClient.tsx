"use client";

import {
  ManagementListControls,
  ManagementPagination,
  type ManagementFilterOption,
} from "@/components/shared/ManagementListControls";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
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
import { InventoryCategory } from "@/modules/inventory-category/types/inventory-category";
import { useState } from "react";
import { deleteInventory } from "../actions/delete-inventory";
import { UNIT_LABEL_MAP } from "../constants/units";
import type { ListInventoriesResult } from "../queries/list-inventories";
import { InventoryItem } from "../types/inventory";
import { CreateInventoryDialog } from "./CreateInventoryDialog";
import { UpdateInventoryDialog } from "./UpdateInventoryDialog";

const statusOptions: ManagementFilterOption[] = [
  { value: "ALL", label: "ทุกสถานะ" },
  { value: "NORMAL", label: "ปกติ" },
  { value: "LOW", label: "สินค้าใกล้หมด" },
  { value: "OUT", label: "สินค้าหมด" },
];

function getStatusBadge(item: InventoryItem) {
  if (item.quantity === 0) {
    return (
      <Badge
        variant="destructive"
        className="bg-rose-50 hover:bg-rose-100 p-2 md:p-3 border-rose-400 text-red-600"
      >
        สินค้าหมด
      </Badge>
    );
  }
  if (item.quantity <= item.reorderLevel) {
    return (
      <Badge
        variant="secondary"
        className="bg-amber-50 hover:bg-amber-100 p-2 md:p-3 border-amber-400 text-amber-600"
      >
        สินค้าใกล้หมด
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className="bg-green-50 hover:bg-green-100 p-2 md:p-3 border-green-400 text-green-600"
    >
      ปกติ
    </Badge>
  );
}

function getUnitLabel(unit: string) {
  return UNIT_LABEL_MAP[unit] || unit;
}

export function InventoriesClient({
  inventoryCategories,
  inventoryData,
}: {
  inventoryCategories: InventoryCategory[];
  inventoryData: ListInventoriesResult;
}) {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] =
    useState<InventoryItem | null>(null);

  const categoryOptions: ManagementFilterOption[] = [
    { value: "ALL", label: "ทุกหมวดหมู่" },
    ...inventoryCategories.map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ];

  return (
    <>
      <div className="gap-6 grid grid-cols-1 md:grid-cols-4 mb-5 w-full">
        <TitleStatus
          title="สินค้าทั้งหมด"
          value={inventoryData.stats.total}
          color="text-blue-500"
        />
        <TitleStatus
          title="สินค้าปกติ"
          value={inventoryData.stats.normalStock}
          color="text-green-500"
        />
        <TitleStatus
          title="สินค้าใกล้หมด"
          value={inventoryData.stats.lowStock}
          color="text-amber-500"
        />
        <TitleStatus
          title="สินค้าหมด"
          value={inventoryData.stats.outOfStock}
          color="text-red-500"
        />
      </div>

      <ManagementListControls
        pageParamName="invPage"
        search={{
          ariaLabel: "ค้นหาสินค้าคงคลัง",
          paramName: "invQ",
          placeholder: "ค้นหาชื่อสินค้า",
          value: inventoryData.q,
        }}
        selectFilters={[
          {
            ariaLabel: "กรองสถานะสินค้า",
            name: "invStatus",
            options: statusOptions,
            placeholder: "สถานะ",
            value: inventoryData.status,
          },
          {
            ariaLabel: "กรองหมวดหมู่สินค้า",
            name: "invCategoryId",
            options: categoryOptions,
            placeholder: "หมวดหมู่",
            value: inventoryData.categoryId,
          },
        ]}
        createAction={
          <CreateInventoryDialog inventoryCategories={inventoryCategories} />
        }
        createActionDesktopOnly
      />

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>ชื่อสินค้า</TableHead>
              <TableHead>หมวดหมู่</TableHead>
              <TableHead className="text-center">จำนวน</TableHead>
              <TableHead>หน่วย</TableHead>
              <TableHead className="text-right">จุดสั่งซื้อ</TableHead>
              <TableHead className="text-left">สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventoryData.inventories.length > 0 ? (
              inventoryData.inventories.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.inventoryCategoryName}</TableCell>
                  <TableCell className="text-center">
                    {product.quantity}
                  </TableCell>
                  <TableCell className="text-center">{getUnitLabel(product.unit)}</TableCell>
                  <TableCell className="text-center">
                    {product.reorderLevel}
                  </TableCell>
                  <TableCell className="text-left">
                    {getStatusBadge(product)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <TableActionButton
                        aria-label="แก้ไขข้อมูล"
                        action="edit"
                        desktopOnly
                        onClick={() => {
                          setSelectedInventory(product);
                          setIsUpdateDialogOpen(true);
                        }}
                      />
                      <TableActionButton
                        aria-label="ลบข้อมูล"
                        action="delete"
                        desktopOnly
                        onClick={() => {
                          setSelectedInventory(product);
                          setIsDeleteDialogOpen(true);
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-muted-foreground text-center"
                >
                  ไม่พบข้อมูลสินค้าคงคลัง
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ManagementPagination
        page={inventoryData.page}
        pageParamName="invPage"
        pageSize={inventoryData.pageSize}
        total={inventoryData.total}
        totalPages={inventoryData.totalPages}
      />

      <UpdateInventoryDialog
        inventoryCategories={inventoryCategories}
        inventory={selectedInventory}
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
      />

      {selectedInventory && (
        <ConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="ยืนยันการลบข้อมูลสินค้าคงคลัง"
          description={`คุณต้องการลบข้อมูลสินค้าคงคลัง "${selectedInventory.name}" หรือไม่?`}
          onConfirm={() => deleteInventory(selectedInventory.id)}
          successMessage="ลบข้อมูลสินค้าคงคลังเรียบร้อย"
          errorMessage="เกิดข้อผิดพลาดในการลบข้อมูลสินค้าคงคลัง"
          mode="delete"
        />
      )}
    </>
  );
}

export function TitleStatus({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="flex flex-row justify-between items-center gap-2 px-5 py-6">
      <CardDescription className="text-sm md:text-base">
        {title}
      </CardDescription>
      <CardTitle
        className={`justify-end pr-5 text-center text-2xl md:text-4xl ${color}`}
      >
        {value}
      </CardTitle>
    </Card>
  );
}
