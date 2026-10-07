"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PURCHASE_ORDER_STATUS_CONFIG,
  PURCHASE_ORDER_STATUS_KEYS,
  type PurchaseOrderStatus,
} from "@/modules/inventories/constants/purchase-order-status";
import { updatePurchaseOrderStatus } from "@/modules/inventories/actions/update-purchase-order-status";
import { getReceivePreview } from "@/modules/inventories/actions/get-receive-preview";
import { receivePurchaseOrderItems } from "@/modules/inventories/actions/receive-purchase-order-items";
import { Check, ChevronDown, Clock, Loader2, Minus, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { DESKTOP_ONLY_CONTAINER_CLASS } from "@/components/shared/TableActionButton";
import type { ReceivePreviewRow } from "@/modules/inventories/types/purchase-order";

export default function StatusUpdate({
  orderId,
  currentStatus,
  desktopOnly,
}: {
  orderId: string;
  currentStatus: PurchaseOrderStatus;
  desktopOnly?: boolean;
}) {
  const [localStatus, setLocalStatus] =
    useState<PurchaseOrderStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const router = useRouter();
  const config = PURCHASE_ORDER_STATUS_CONFIG[localStatus];
  const groups = ["Not Started", "Active", "Closed"] as const;

  // state ของ dialog ยืนยันรับของ
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewRows, setPreviewRows] = useState<ReceivePreviewRow[]>([]);
  const [receivedQuantities, setReceivedQuantities] = useState<
    Record<string, number>
  >({});

  /**
   * เมื่อ newStatus === "RECEIVED" หรือ "PARTIALLY_RECEIVED" → ดึง preview ก่อน แล้วค่อยเปิด dialog
   * สถานะอื่น → เปลี่ยนทันที
   */
  const handleStatusChange = async (newStatus: PurchaseOrderStatus) => {
    if (newStatus === localStatus) return;

    if (newStatus === "RECEIVED") {
      setIsLoadingPreview(true);
      try {
        const result = await getReceivePreview(orderId);
        if (!result.success) {
          toast.error(result.error || "ไม่สามารถดึงข้อมูลสินค้าได้");
          return;
        }

        const initialQuantities: Record<string, number> = {};
        result.data.forEach((row) => {
          initialQuantities[row.purchaseOrderItemId] = row.remainingQuantity;
        });

        setReceivedQuantities(initialQuantities);
        setPreviewRows(result.data);
        setDialogOpen(true);
      } catch {
        toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setIsLoadingPreview(false);
      }
      return;
    }

    commitStatusChange(newStatus);
  };

  /** commit การเปลี่ยนสถานะจริง (ไม่ผ่าน dialog) */
  const commitStatusChange = (newStatus: PurchaseOrderStatus) => {
    const prevStatus = localStatus;
    setLocalStatus(newStatus);

    startTransition(async () => {
      try {
        const result = await updatePurchaseOrderStatus(orderId, newStatus);

        if (!result.success) {
          setLocalStatus(prevStatus);
          toast.error(result.error || "ไม่สามารถอัปเดตสถานะได้");
          router.refresh();
          return;
        }

        toast.success("อัปเดตสถานะใบสั่งซื้อเรียบร้อย");
        router.refresh();
      } catch (error) {
        setLocalStatus(prevStatus);
        const errorMessage =
          error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่รู้จัก";
        toast.error(`เกิดข้อผิดพลาด: ${errorMessage}`);
        router.refresh();
      }
    });
  };

  /** ยืนยัน dialog → เรียก receivePurchaseOrderItems */
  const handleConfirmReceive = () => {
    startTransition(async () => {
      try {
        const itemsPayload = previewRows.map((row) => ({
          purchaseOrderItemId: row.purchaseOrderItemId,
          receivedQuantity:
            receivedQuantities[row.purchaseOrderItemId] ?? row.remainingQuantity,
        }));

        const result = await receivePurchaseOrderItems({
          purchaseOrderId: orderId,
          items: itemsPayload,
        });

        if (!result.success) {
          toast.error(result.error || "ไม่สามารถบันทึกการรับสินค้าได้");
          return;
        }

        setDialogOpen(false);
        setLocalStatus(result.data.status);
        toast.success(
          result.data.status === "RECEIVED"
            ? "ตรวจรับสินค้าครบถ้วนเรียบร้อย"
            : "บันทึกการตรวจรับสินค้าบางส่วนเรียบร้อย",
        );
        router.refresh();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่รู้จัก";
        toast.error(`เกิดข้อผิดพลาด: ${errorMessage}`);
      }
    });
  };

  // ตรวจสอบว่ามีรายการใดที่รับไม่ครบหรือไม่
  const hasShortage = previewRows.some((row) => {
    const qty =
      receivedQuantities[row.purchaseOrderItemId] ?? row.remainingQuantity;
    return qty < row.remainingQuantity;
  });

  const totalReceivedCount = previewRows.reduce((sum, row) => {
    const qty =
      receivedQuantities[row.purchaseOrderItemId] ?? row.remainingQuantity;
    return sum + qty;
  }, 0);

  return (
    <>
      {desktopOnly && (
        <Badge
          className={`${config.color} inline-flex min-h-8 items-center rounded-md px-3 text-xs font-semibold lg:hidden`}
        >
          {config.title}
        </Badge>
      )}

      <ButtonGroup
        className={desktopOnly ? DESKTOP_ONLY_CONTAINER_CLASS : undefined}
      >
        <Button
          variant="ghost"
          size="lg"
          className={`${config.color} w-28 md:w-32`}
          disabled={isPending || isLoadingPreview || config.next === null}
          onClick={() => config.next && handleStatusChange(config.next)}
        >
          {isLoadingPreview && config.next === "RECEIVED" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            config.title
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="lg"
              className={config.color}
              disabled={isPending || isLoadingPreview}
            >
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className="z-50 bg-popover shadow-xl p-2 border rounded-xl w-56"
          >
            {groups.map((group) => {
              const groupItems = PURCHASE_ORDER_STATUS_KEYS.filter(
                (key) => PURCHASE_ORDER_STATUS_CONFIG[key].group === group,
              );

              if (groupItems.length === 0) return null;

              return (
                <div key={group} className="mb-2 last:mb-0">
                  <div className="flex items-center px-2 py-1">
                    <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                      {group}
                    </span>
                  </div>

                  {groupItems.map((key) => {
                    const itemConfig = PURCHASE_ORDER_STATUS_CONFIG[key];
                    const isSelected = localStatus === key;

                    return (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => handleStatusChange(key)}
                        className={`mb-0.5 flex cursor-pointer items-center justify-between rounded-md px-2 py-2 ${
                          isSelected
                            ? "bg-accent font-bold text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex size-5 items-center justify-center rounded-full border-2 ${itemConfig.dot}`}
                          >
                            {key === "ORDERED" && (
                              <Clock size={10} className="p-0.5 text-white" />
                            )}
                            {key === "PARTIALLY_RECEIVED" && (
                              <Clock size={10} className="p-0.5 text-white" />
                            )}
                            {key === "RECEIVED" && (
                              <Check size={10} className="p-0.5 text-white" />
                            )}
                            {key === "CANCELLED" && (
                              <X size={10} className="p-0.5 text-white" />
                            )}
                          </div>
                          <span className="text-sm uppercase tracking-wide">
                            {itemConfig.title}
                          </span>
                        </div>

                        {isSelected && (
                          <Check size={14} className="text-primary" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>

      {/* Dialog ยืนยันการรับของ พร้อมกรอกจำนวนรับจริง */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              ตรวจรับสินค้าเข้าคลัง
            </DialogTitle>
            <DialogDescription>
              ระบุจำนวนสินค้าที่ได้รับจริงในแต่ละรายการ ระบบจะคำนวณส่วนต่างและอัปเดตสต็อกตามจริง
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[35%]">ชื่อสินค้า</TableHead>
                  <TableHead className="text-right">stock เดิม</TableHead>
                  <TableHead className="text-right">จำนวนสั่งซื้อ</TableHead>
                  <TableHead className="text-center w-[160px]">
                    จำนวนที่รับจริง
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    สต็อกหลังรับ
                  </TableHead>
                  <TableHead className="text-center w-[110px]">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row) => {
                  const actualQty =
                    receivedQuantities[row.purchaseOrderItemId] ??
                    row.remainingQuantity;
                  const isShortage = actualQty < row.remainingQuantity;
                  const shortageQty = row.remainingQuantity - actualQty;
                  const projectedStock = row.currentStock + actualQty;

                  return (
                    <TableRow key={row.purchaseOrderItemId}>
                      <TableCell className="font-medium">
                        <div>{row.inventoryItemName}</div>
                        {row.receivedQuantity > 0 && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            รับแล้วรอบก่อน: {row.receivedQuantity} ชิ้น (ค้างส่ง:{" "}
                            {row.remainingQuantity} ชิ้น)
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {row.currentStock}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground font-medium">
                        {row.orderedQuantity}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-7 shrink-0"
                            disabled={actualQty <= 0 || isPending}
                            onClick={() =>
                              setReceivedQuantities((prev) => ({
                                ...prev,
                                [row.purchaseOrderItemId]: Math.max(
                                  0,
                                  actualQty - 1,
                                ),
                              }))
                            }
                          >
                            <Minus className="size-3" />
                          </Button>
                          <Input
                            type="number"
                            min={0}
                            max={row.remainingQuantity}
                            value={actualQty}
                            disabled={isPending}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              const parsed = isNaN(val) ? 0 : val;
                              const clamped = Math.max(
                                0,
                                Math.min(row.remainingQuantity, parsed),
                              );
                              setReceivedQuantities((prev) => ({
                                ...prev,
                                [row.purchaseOrderItemId]: clamped,
                              }));
                            }}
                            className="h-7 w-16 text-center text-sm font-semibold p-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-7 shrink-0"
                            disabled={
                              actualQty >= row.remainingQuantity || isPending
                            }
                            onClick={() =>
                              setReceivedQuantities((prev) => ({
                                ...prev,
                                [row.purchaseOrderItemId]: Math.min(
                                  row.remainingQuantity,
                                  actualQty + 1,
                                ),
                              }))
                            }
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {projectedStock}
                      </TableCell>
                      <TableCell className="text-center">
                        {isShortage ? (
                          <Badge
                            variant="outline"
                            className="text-amber-600 border-amber-500/40 bg-amber-500/10 text-[11px] whitespace-nowrap"
                          >
                            ขาด {shortageQty}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-emerald-600 border-emerald-500/40 bg-emerald-500/10 text-[11px] whitespace-nowrap"
                          >
                            ครบถ้วน
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Warning / Summary banner */}
          {hasShortage ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <Clock className="size-4 mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">
                  ตรวจพบสินค้าที่ได้รับไม่ครบตามยอดสั่งซื้อ
                </p>
                <p className="text-xs text-amber-700/90 dark:text-amber-300/90 mt-0.5">
                  ใบสั่งซื้อนี้จะเปลี่ยนเป็นสถานะ{" "}
                  <strong>"รับสินค้าบางส่วน" (Partially Received)</strong>{" "}
                  และระบบจะบันทึกรายการสินค้าที่ขาดไว้เพื่อรองรับการตรวจรับเพิ่มในรอบถัดไป
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
              <Check className="size-4 shrink-0 text-emerald-600" />
              <p className="font-semibold">
                สินค้าครบถ้วนทุกรายการ — ใบสั่งซื้อจะเปลี่ยนสถานะเป็น{" "}
                <strong>"รับของแล้ว" (Received)</strong>
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between items-center pt-2">
            <div className="text-xs text-muted-foreground">
              ยอดรับรอบนี้:{" "}
              <strong className="text-foreground">
                {totalReceivedCount} ชิ้น
              </strong>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isPending}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleConfirmReceive}
                disabled={isPending || totalReceivedCount <= 0}
                className={
                  hasShortage
                    ? "bg-sky-600 hover:bg-sky-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }
              >
                {isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-2" />
                    กำลังบันทึก…
                  </>
                ) : hasShortage ? (
                  "ยืนยันรับสินค้าบางส่วน"
                ) : (
                  "ยืนยันรับสินค้าครบถ้วน"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
