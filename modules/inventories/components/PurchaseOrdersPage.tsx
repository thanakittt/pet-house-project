"use client";

import {
  ManagementListControls,
  ManagementPagination,
  type ManagementFilterOption,
} from "@/components/shared/ManagementListControls";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
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
import Link from "next/link";
import StatusUpdate from "@/modules/inventories/components/StatusUpdate";
import {
  PURCHASE_ORDER_STATUS_CONFIG,
  PURCHASE_ORDER_STATUS_KEYS,
  PurchaseOrderStatus,
} from "@/modules/inventories/constants/purchase-order-status";
import { deletePurchaseOrder } from "@/modules/inventories/actions/delete-purchase-order";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { ListPurchaseOrdersResult } from "@/modules/inventories/queries/list-purchase-orders";
import { PurchaseOrderSummary } from "@/modules/inventories/types/purchase-order";
import { useState } from "react";

const orderStatusOptions: ManagementFilterOption[] = [
  { value: "ALL", label: "ทั้งหมด" },
  ...PURCHASE_ORDER_STATUS_KEYS.map((status) => ({
    value: status,
    label: PURCHASE_ORDER_STATUS_CONFIG[status].title,
  })),
];

function formatCurrency(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "฿0.00";
  return `฿${num.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function PurchaseOrdersPage({
  orderData,
}: {
  orderData: ListPurchaseOrdersResult;
}) {
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrderSummary | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const rowOffset = (orderData.page - 1) * orderData.pageSize;

  return (
    <main>
      <div className="mx-auto w-full py-5 md:w-5xl">
        <ManagementListControls
          pageParamName="orderPage"
          search={{
            ariaLabel: "ค้นหาใบสั่งซื้อ",
            paramName: "orderQ",
            placeholder: "ค้นหาพนักงานหรือวันที่สั่งซื้อ",
            value: orderData.q,
          }}
          selectFilters={[
            {
              ariaLabel: "กรองสถานะใบสั่งซื้อ",
              name: "orderStatus",
              options: orderStatusOptions,
              placeholder: "สถานะ",
              value: orderData.status,
            },
          ]}
          createAction={
            <Button asChild>
              <Link href="/back-office/inventories/purchase-orders/create">
                <PlusIcon data-icon="inline-start" />
                สร้างใบสั่งซื้อ
              </Link>
            </Button>
          }
        />

        <div className="overflow-x-auto rounded-md border">
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
              {orderData.orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    ไม่พบข้อมูลใบสั่งซื้อ
                  </TableCell>
                </TableRow>
              ) : (
                orderData.orders.map((order, index) => (
                  <TableRow key={order.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {rowOffset + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {order.staffNickname}
                    </TableCell>
                    <TableCell>{formatDate(order.orderDate)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <StatusUpdate
                        orderId={order.id}
                        currentStatus={order.status as PurchaseOrderStatus}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TableActionLink
                          aria-label="ดูรายละเอียดใบสั่งซื้อ"
                          action="view"
                          href={`/back-office/inventories/purchase-orders/${order.id}`}
                        />

                        {order.status === "DRAFT" ? (
                          <TableActionButton
                            aria-label="ลบใบสั่งซื้อ"
                            action="delete"
                            onClick={() => {
                              setDeleteTarget(order);
                              setIsDeleteDialogOpen(true);
                            }}
                          />
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <ManagementPagination
          page={orderData.page}
          pageParamName="orderPage"
          pageSize={orderData.pageSize}
          total={orderData.total}
          totalPages={orderData.totalPages}
        />
      </div>

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
