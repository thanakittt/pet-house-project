"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Transaction } from "../types/transaction";
import { formatCurrency, formatThaiDate } from "@/lib/utils";
import { TableActionButton } from "@/components/shared/TableActionButton";

interface TransactionsTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export function TransactionsTable({
  transactions,
  onEdit,
  onDelete,
}: TransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex justify-center items-center p-8 text-muted-foreground border rounded-md bg-white">
        ไม่พบรายการเคลื่อนไหว
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>วันที่</TableHead>
            <TableHead>หมายเหตุ</TableHead>
            <TableHead>หมวดหมู่</TableHead>
            <TableHead className="text-right">จำนวนเงิน</TableHead>
            <TableHead className="text-center w-[100px]">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell>{formatThaiDate(tx.transactionDate)}</TableCell>
              <TableCell>{tx.note || "-"}</TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  {tx.categoryName}
                </span>
              </TableCell>
              <TableCell
                className={`text-right font-medium ${tx.categoryType === "INCOME" ? "text-green-600" : "text-red-600"}`}
              >
                {tx.categoryType === "INCOME" ? "+" : "-"}
                {formatCurrency(tx.amount).replace("฿", "")}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center gap-1">
                  <TableActionButton
                    variant="ghost"
                    className="size-8"
                    aria-label="แก้ไข"
                    action="edit"
                    desktopOnly
                    onClick={() => onEdit(tx)}
                    disabled={!tx.isManual}
                    title={
                      !tx.isManual
                        ? "ไม่สามารถแก้ไขรายการอัตโนมัติได้"
                        : "แก้ไข"
                    }
                  />
                  <TableActionButton
                    variant="ghost"
                    className="size-8"
                    aria-label="ลบ"
                    action="delete"
                    desktopOnly
                    onClick={() => onDelete(tx)}
                    disabled={!tx.isManual}
                    title={
                      !tx.isManual ? "ไม่สามารถลบรายการอัตโนมัติได้" : "ลบ"
                    }
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
