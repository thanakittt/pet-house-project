"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  TableActionButton,
  TABLE_ACTION_ICONS,
} from "@/components/shared/TableActionButton";
import { useState } from "react";
import { CreateTransactionCategoryDialog } from "./CreateTransactionCategoryDialog";
import {
  TransactionCategory,
  TRANSACTION_TYPE_LABELS,
} from "../types/transaction-category";
import { UpdateTransactionCategoryDialog } from "./UpdateTransactionCategoryDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { deleteTransactionCategory } from "../actions/delete-transaction-category";

export function TransactionCategoryManagement({
  transactionCategories,
}: {
  transactionCategories: TransactionCategory[];
}) {
  // state สำหรับควบคุม dialog แก้ไขและลบ
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransactionCategory, setSelectedTransactionCategory] =
    useState<TransactionCategory | null>(null);

  return (
    <>
      {/* แถบเครื่องมือด้านบน: ปุ่มสร้างหมวดหมู่ใหม่ */}
      <div className="justify-between items-center gap-3 grid grid-cols-2 mb-5">
        <div className="flex items-center gap-3"></div>
        <div className="flex justify-end">
          <CreateTransactionCategoryDialog />
        </div>
      </div>

      {/* ตารางแสดงรายการหมวดหมู่ธุรกรรม */}
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>ชื่อหมวดหมู่</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactionCategories && transactionCategories.length > 0 ? (
              transactionCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>
                    {/* Badge แสดงประเภทธุรกรรมพร้อมสีที่แตกต่างกัน */}
                    <Badge
                      variant={
                        category.type === "INCOME" ? "default" : "secondary"
                      }
                    >
                      {TRANSACTION_TYPE_LABELS[category.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                    {/* ปุ่มแก้ไขข้อมูลหมวดหมู่ */}
                    <TableActionButton
                      aria-label="แก้ไขข้อมูล"
                      icon={TABLE_ACTION_ICONS.edit}
                      onClick={() => {
                        setSelectedTransactionCategory(category);
                        setIsUpdateDialogOpen(true);
                      }}
                    />

                    {/* ปุ่มลบข้อมูลหมวดหมู่ */}
                    <TableActionButton
                      aria-label="ลบข้อมูล"
                      icon={TABLE_ACTION_ICONS.delete}
                      onClick={() => {
                        setSelectedTransactionCategory(category);
                        setIsDeleteDialogOpen(true);
                      }}
                    />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              // แสดงข้อความเมื่อไม่มีข้อมูล
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center">
                  ไม่มีข้อมูล
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog แก้ไขและลบ — render เมื่อมี row ที่ถูกเลือกเท่านั้น */}
      {selectedTransactionCategory && (
        <>
          <UpdateTransactionCategoryDialog
            open={isUpdateDialogOpen}
            onOpenChange={setIsUpdateDialogOpen}
            transactionCategory={selectedTransactionCategory}
          />

          <ConfirmDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            title="ยืนยันการลบข้อมูลหมวดหมู่ธุรกรรม"
            description={`คุณต้องการลบข้อมูลหมวดหมู่ธุรกรรม "${selectedTransactionCategory.name}" หรือไม่?`}
            onConfirm={() =>
              deleteTransactionCategory({ id: selectedTransactionCategory.id })
            }
            successMessage="ลบข้อมูลหมวดหมู่ธุรกรรมเรียบร้อย"
            errorMessage="เกิดข้อผิดพลาดในการลบข้อมูลหมวดหมู่ธุรกรรม"
          />
        </>
      )}
    </>
  );
}
