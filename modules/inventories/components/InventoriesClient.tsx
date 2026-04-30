"use client";

import { Badge } from "@/components/ui/badge";
import { TableActionButton } from "@/components/shared/TableActionButton";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo, useState } from "react";
import { InventoryItem } from "../types/inventory";
import { InventoryCategory } from "@/modules/inventory-category/types/inventory-category";
import { CreateInventoryDialog } from "./CreateInventoryDialog";
import { UpdateInventoryDialog } from "./UpdateInventoryDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { deleteInventory } from "../actions/delete-inventory";
import { UNIT_LABEL_MAP } from "../constants/units";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function getStatusBadge(item: InventoryItem) {
  if (item.quantity === 0) {
    return (
      <Badge
        variant="destructive"
        className="bg-rose-100 hover:bg-rose-200 p-2 md:p-4 border-rose-300 text-red-500"
      >
        สินค้าหมด
      </Badge>
    );
  }
  if (item.quantity <= item.reorderLevel) {
    return (
      <Badge
        variant="secondary"
        className="bg-amber-100 hover:bg-amber-200 p-2 md:p-4 border-amber-300 text-amber-500"
      >
        สินค้าใกล้หมด
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className="bg-green-100 hover:bg-green-200 p-2 md:p-4 border-green-300 text-green-500"
    >
      ปกติ
    </Badge>
  );
}

function getUnitLabel(unit: string) {
  return UNIT_LABEL_MAP[unit] || unit;
}

export function InventoriesClient({
  inventories,
  inventoryCategories,
}: {
  inventories: InventoryItem[];
  inventoryCategories: InventoryCategory[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] =
    useState<InventoryItem | null>(null);

  const filteredInventories = useMemo(() => {
    return inventories.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === "out") {
        matchesStatus = item.quantity === 0;
      } else if (statusFilter === "low") {
        matchesStatus = item.quantity > 0 && item.quantity <= item.reorderLevel;
      } else if (statusFilter === "normal") {
        matchesStatus = item.quantity > item.reorderLevel;
      }

      return matchesSearch && matchesStatus;
    });
  }, [inventories, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = inventories.length;
    let lowStock = 0;
    let outOfStock = 0;

    for (const item of inventories) {
      if (item.quantity === 0) {
        outOfStock++;
      } else if (item.quantity <= item.reorderLevel) {
        lowStock++;
      }
    }

    return { total, lowStock, outOfStock };
  }, [inventories]);

  return (
    <div className="mx-auto py-5 w-full md:w-5xl">
      {/* status card */}
      <div className="gap-6 grid grid-cols-1 md:grid-cols-3 mb-5 w-full md:w-5xl">
        <TitleStatus
          title="สินค้าทั้งหมด"
          value={stats.total}
          color="text-green-500"
        />
        <TitleStatus
          title="สินค้าใกล้หมด"
          value={stats.lowStock}
          color="text-amber-500"
        />
        <TitleStatus
          title="สินค้าหมด"
          value={stats.outOfStock}
          color="text-red-500"
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div className="flex flex-1 items-center gap-4">
          <Input
            placeholder="ค้นหาสินค้า"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full max-w-48 h-10">
              <SelectValue placeholder="สถานะสินค้า" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>สถานะสินค้า</SelectLabel>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="normal">ปกติ</SelectItem>
                <SelectItem value="low">สินค้าใกล้หมด</SelectItem>
                <SelectItem value="out">สินค้าหมด</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <CreateInventoryDialog inventoryCategories={inventoryCategories} />
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>ชื่อสินค้า</TableHead>
              <TableHead>หมวดหมู่</TableHead>
              <TableHead className="text-right">จำนวน</TableHead>
              <TableHead>หน่วย</TableHead>
              <TableHead className="text-right">จุดสั่งซื้อ</TableHead>
              <TableHead className="text-center">สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventories.length > 0 ? (
              filteredInventories.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.inventoryCategoryName}</TableCell>
                  <TableCell className="text-right">
                    {product.quantity}
                  </TableCell>
                  <TableCell>{getUnitLabel(product.unit)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {product.reorderLevel}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(product)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <TableActionButton
                        aria-label="แก้ไขข้อมูล"
                        action="edit"
                        onClick={() => {
                          setSelectedInventory(product);
                          setIsUpdateDialogOpen(true);
                        }}
                      />
                      <TableActionButton
                        aria-label="ลบข้อมูล"
                        action="delete"
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
                  className="py-10 text-center text-muted-foreground"
                >
                  ไม่พบข้อมูลสินค้า
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
          title="ยืนยันการลบข้อมูลสินค้า"
          description={`คุณต้องการลบข้อมูลสินค้า "${selectedInventory.name}" หรือไม่?`}
          onConfirm={() => deleteInventory(selectedInventory.id)}
          successMessage="ลบข้อมูลสินค้าเรียบร้อย"
          errorMessage="เกิดข้อผิดพลาดในการลบข้อมูลสินค้า"
        />
      )}
    </div>
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
        className={`text-2xl md:text-4xl text-center justify-end ${color} pr-5`}
      >
        {value}
      </CardTitle>
    </Card>
  );
}
