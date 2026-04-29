"use client";

import { Button } from "@/components/ui/button";
import { PlusIcon, Trash2, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import StatusUpdate from "@/modules/inventories/components/StatusUpdate";
import { PurchaseOrderSummary } from "@/modules/inventories/types/purchase-order";
import { PurchaseOrderStatus } from "@/modules/inventories/constants/purchase-order-status";
import { deletePurchaseOrder } from "@/modules/inventories/actions/delete-purchase-order";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useState } from "react";

// ── Helper: format ยอดเงินเป็นบาท ──
function formatCurrency(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "฿0.00";
  return `฿${num.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── Helper: format วันที่เป็น dd/mm/yyyy ──
function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * PurchaseOrdersPage — หน้าแสดงรายการใบสั่งซื้อทั้งหมด
 * รับข้อมูลจาก Server Component parent เป็น prop (ไม่ใช้ mock data)
 */
export default function PurchaseOrdersPage({
  orders,
}: {
  orders: PurchaseOrderSummary[];
}) {
  // state สำหรับ delete confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrderSummary | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <main>
      <div className="mx-auto py-5 w-full md:w-5xl">
        {/* ── Header ── */}
        <div className="flex justify-end mb-5">
          <Button asChild>
            <Link href="/back-office/inventories/purchase-orders/create">
              <PlusIcon data-icon="inline-start" />
              สร้างใบสั่งซื้อ
            </Link>
          </Button>
        </div>

        {/* ── ตาราง PO ── */}
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>เลขที่</TableHead>
                <TableHead>พนักงาน</TableHead>
                <TableHead>วันที่สั่งซื้อ</TableHead>
                <TableHead className="text-right">ยอดรวม</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                // ── Empty state ──
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-muted-foreground text-center"
                  >
                    ยังไม่มีใบสั่งซื้อ กดปุ่ม &quot;สร้างใบสั่งซื้อ&quot;
                    เพื่อเริ่มต้น
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order, index) => (
                  <TableRow key={order.id}>
                    {/* เลขลำดับ */}
                    <TableCell className="text-muted-foreground text-sm">
                      {index + 1}
                    </TableCell>

                    {/* ชื่อพนักงาน */}
                    <TableCell className="font-medium">
                      {order.staffNickname}
                    </TableCell>

                    {/* วันที่สั่งซื้อ */}
                    <TableCell>{formatDate(order.orderDate)}</TableCell>

                    {/* ยอดรวม */}
                    <TableCell className="font-semibold tabular-nums text-right">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>

                    {/* StatusUpdate — เชื่อม server action จริง */}
                    <TableCell>
                      <StatusUpdate
                        orderId={order.id}
                        currentStatus={order.status as PurchaseOrderStatus}
                      />
                    </TableCell>

                    {/* ── ปุ่มจัดการ: ดูรายละเอียด + ลบ (เฉพาะ DRAFT) ── */}
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        {/* ปุ่มดูรายละเอียด */}
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="ดูรายละเอียดใบสั่งซื้อ"
                          asChild
                        >
                          <Link
                            href={`/inventories/purchase-orders/${order.id}`}
                          >
                            <Eye className="size-3.5" />
                          </Link>
                        </Button>

                        {/* ปุ่มลบ (เฉพาะ DRAFT) */}
                        {order.status === "DRAFT" ? (
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="ลบใบสั่งซื้อ"
                            onClick={() => {
                              setDeleteTarget(order);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Delete Confirmation Dialog ── */}
      {deleteTarget && (
        <ConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="ยืนยันการลบใบสั่งซื้อ"
          description={`คุณต้องการลบใบสั่งซื้อของ "${deleteTarget.staffNickname}" วันที่ ${formatDate(deleteTarget.orderDate)} หรือไม่?`}
          onConfirm={() => deletePurchaseOrder(deleteTarget.id)}
          successMessage="ลบใบสั่งซื้อเรียบร้อย"
          errorMessage="เกิดข้อผิดพลาดในการลบใบสั่งซื้อ"
        />
      )}
    </main>
  );
}
