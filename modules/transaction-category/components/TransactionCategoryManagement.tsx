"use client";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  ManagementListControls,
  ManagementPagination,
  type ManagementFilterOption,
} from "@/components/shared/ManagementListControls";
import { TableActionButton } from "@/components/shared/TableActionButton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { deleteTransactionCategory } from "../actions/delete-transaction-category";
import type { ListTransactionCategoriesResult } from "../queries/list-transaction-categories";
import {
  TransactionCategory,
  TRANSACTION_TYPE_LABELS,
} from "../types/transaction-category";
import { CreateTransactionCategoryDialog } from "./CreateTransactionCategoryDialog";
import { UpdateTransactionCategoryDialog } from "./UpdateTransactionCategoryDialog";

const typeOptions: ManagementFilterOption[] = [
  { value: "ALL", label: "ทุกประเภท" },
  { value: "INCOME", label: TRANSACTION_TYPE_LABELS.INCOME },
  { value: "EXPENSE", label: TRANSACTION_TYPE_LABELS.EXPENSE },
];

export function TransactionCategoryManagement({
  transactionCategories,
  total,
  page,
  pageSize,
  totalPages,
  q,
  type,
}: ListTransactionCategoriesResult) {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransactionCategory, setSelectedTransactionCategory] =
    useState<TransactionCategory | null>(null);

  return (
    <>
      <ManagementListControls
        search={{
          ariaLabel: "ค้นหาหมวดหมู่ธุรกรรม",
          placeholder: "ค้นหาชื่อหมวดหมู่ธุรกรรม",
          value: q,
        }}
        selectFilters={[
          {
            ariaLabel: "กรองประเภทธุรกรรม",
            name: "type",
            options: typeOptions,
            placeholder: "ประเภท",
            value: type,
          },
        ]}
        createAction={<CreateTransactionCategoryDialog />}
      />

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
            {transactionCategories.length > 0 ? (
              transactionCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>
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
                      <TableActionButton
                        aria-label="แก้ไขข้อมูล"
                        action="edit"
                        onClick={() => {
                          setSelectedTransactionCategory(category);
                          setIsUpdateDialogOpen(true);
                        }}
                      />

                      <TableActionButton
                        aria-label="ลบข้อมูล"
                        action="delete"
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
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center">
                  ไม่พบข้อมูลหมวดหมู่ธุรกรรม
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
            mode="delete"
          />
        </>
      )}
    </>
  );
}
