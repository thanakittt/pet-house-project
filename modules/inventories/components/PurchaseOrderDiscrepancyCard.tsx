"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  PackageCheck,
  Check,
  MinusIcon,
  PlusIcon,
  Clock,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Info,
} from "lucide-react";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { getReceivePreview } from "@/modules/inventories/actions/get-receive-preview";
import { receivePurchaseOrderItems } from "@/modules/inventories/actions/receive-purchase-order-items";
import { resolvePurchaseOrderDiscrepancy } from "@/modules/inventories/actions/resolve-purchase-order-discrepancy";
import {
  PURCHASE_ORDER_MANUAL_RESOLUTION_TYPES,
  RESOLUTION_TYPE_CONFIG,
  type PurchaseOrderManualResolutionType,
} from "@/modules/inventories/constants/purchase-order-issue";
import type { PurchaseOrderStatus } from "@/modules/inventories/constants/purchase-order-status";
import type {
  PurchaseOrderItemDetail,
  PurchaseOrderIssueDetail,
  ReceivePreviewRow,
} from "@/modules/inventories/types/purchase-order";
import { formatThaiDateTime } from "@/lib/utils";

// ── Helper: format ยอดเงินเป็นบาท ──
function formatCurrency(value: number): string {
  return value.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface PurchaseOrderDiscrepancyCardProps {
  orderId: string;
  items: PurchaseOrderItemDetail[];
  issues?: PurchaseOrderIssueDetail[];
  orderStatus?: PurchaseOrderStatus;
}

export default function PurchaseOrderDiscrepancyCard({
  orderId,
  items,
  issues = [],
  orderStatus,
}: PurchaseOrderDiscrepancyCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State สำหรับ Dialog ตรวจรับสินค้าส่วนที่เหลือ
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewRows, setPreviewRows] = useState<ReceivePreviewRow[]>([]);
  const [receivedQuantities, setReceivedQuantities] = useState<
    Record<string, number>
  >({});

  // State สำหรับ Dialog ยุติปัญหาของขาด (Resolve Issue)
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedResolutionType, setSelectedResolutionType] =
    useState<PurchaseOrderManualResolutionType>("DISCOUNT_NEXT_ORDER");
  const [resolutionNote, setResolutionNote] = useState("");

  // กรองรายการปัญหาที่ถูกยุติเรียบร้อยแล้วโดยไม่ส่งของ
  const resolvedNonDeliveryIssues = issues.filter(
    (iss) =>
      iss.status === "RESOLVED" &&
      iss.resolutionType &&
      iss.resolutionType !== "ALL_ITEMS_RECEIVED",
  );

  // กรองเฉพาะรายการที่ยังมีของค้างส่งและยังไม่ได้รับการยุติปัญหา (shortage > 0 และ issue ยังไม่ RESOLVED)
  // หากสถานะ PO เป็น RECEIVED แล้ว หรือรายการถูก Resolve แล้ว จะไม่นับเป็น outstanding
  const outstandingItems =
    orderStatus === "RECEIVED"
      ? []
      : items
          .filter((item) => {
            const hasShortage = item.quantity > item.receivedQuantity;
            if (!hasShortage) return false;
            const matchingIssue = issues.find(
              (iss) => iss.purchaseOrderItemId === item.id,
            );
            return matchingIssue?.status !== "RESOLVED";
          })
          .map((item) => {
            const shortage = item.quantity - item.receivedQuantity;
            const unitCostNum = parseFloat(item.unitCost) || 0;
            const matchingIssue = issues.find(
              (iss) =>
                iss.purchaseOrderItemId === item.id && iss.status === "OPEN",
            );

            return {
              ...item,
              shortageQuantity: shortage,
              unitCostNum,
              shortageAmount: shortage * unitCostNum,
              issueId: matchingIssue?.id,
            };
          });

  // หากไม่มีรายการค้างส่ง แต่มีรายการที่ยุติปัญหาแล้ว → แสดงการ์ดยืนยันการยุติปัญหา (Resolved card)
  if (outstandingItems.length === 0) {
    if (resolvedNonDeliveryIssues.length > 0) {
      const primaryIssue = resolvedNonDeliveryIssues[0];
      const resConfig = primaryIssue?.resolutionType
        ? RESOLUTION_TYPE_CONFIG[
            primaryIssue.resolutionType as PurchaseOrderManualResolutionType
          ]
        : null;

      const totalResolvedShortage = resolvedNonDeliveryIssues.reduce(
        (sum, iss) => sum + iss.shortageQuantity,
        0,
      );

      return (
        <Card
          id="po-resolved-discrepancy-card"
          className="py-6 mt-6 border-emerald-500/30"
        >
          <CardHeader className="px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    บันทึกการยุติปัญหาของขาดในใบสั่งซื้อ
                  </CardTitle>
                  {resConfig && (
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold ${resConfig.badgeClass}`}
                    >
                      {resConfig.shortLabel}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs text-muted-foreground">
                  ใบสั่งซื้อนี้ปิดสมบูรณ์แล้วโดยยุติปัญหาของขาด (
                  {totalResolvedShortage} ชิ้น) ตามข้อตกลงร่วมกับผู้จำหน่าย
                </CardDescription>
              </div>

              {primaryIssue?.resolvedAt && (
                <div className="text-xs text-muted-foreground">
                  บันทึกเมื่อ:{" "}
                  <span className="font-medium text-foreground">
                    {formatThaiDateTime(primaryIssue.resolvedAt)}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 flex flex-col space-y-4">
            {primaryIssue?.resolutionNote && (
              <div className="mx-6 bg-muted/50 rounded-lg p-4 text-sm flex items-start gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                  <FileText className="size-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground">
                    บันทึกข้อตกลง
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {primaryIssue.resolutionNote}
                  </p>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <Table id="po-resolved-issues-table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-left">#</TableHead>
                    <TableHead>รายการสินค้าที่ขาด</TableHead>
                    <TableHead className="text-right">จำนวนสั่ง</TableHead>
                    <TableHead className="text-right">รับจริง</TableHead>
                    <TableHead className="text-right">ยอดขาดที่ยุติ</TableHead>
                    <TableHead className="text-center">รูปแบบการยุติ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resolvedNonDeliveryIssues.map((iss, idx) => (
                    <TableRow key={iss.id}>
                      <TableCell className="text-muted-foreground text-left font-medium">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-primary font-medium">
                        {iss.inventoryItemName}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {iss.orderedQuantity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {iss.receivedQuantity}
                      </TableCell>
                      <TableCell className="text-right font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {iss.shortageQuantity} ชิ้น
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className="bg-muted text-muted-foreground text-xs"
                        >
                          ยุติปัญหาแล้ว
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  }

  const totalShortageQuantity = outstandingItems.reduce(
    (sum, item) => sum + item.shortageQuantity,
    0,
  );
  const totalShortageAmount = outstandingItems.reduce(
    (sum, item) => sum + item.shortageAmount,
    0,
  );

  /**
   * เปิด Dialog และโหลดข้อมูล preview รายการสินค้าที่ยังค้างส่ง
   */
  const handleOpenReceiveDialog = async () => {
    setIsLoadingPreview(true);
    try {
      const result = await getReceivePreview(orderId);
      if (!result.success) {
        toast.error(result.error || "ไม่สามารถโหลดข้อมูลสินค้าคงคลังได้");
        return;
      }

      // แสดงเฉพาะรายการที่ยังมียอดค้างส่ง (remainingQuantity > 0)
      const outstandingRows = result.data.filter(
        (row) => row.remainingQuantity > 0,
      );

      const initialQuantities: Record<string, number> = {};
      outstandingRows.forEach((row) => {
        initialQuantities[row.purchaseOrderItemId] = row.remainingQuantity;
      });

      setPreviewRows(outstandingRows);
      setReceivedQuantities(initialQuantities);
      setReceiveDialogOpen(true);
    } catch (error) {
      console.error("handleOpenReceiveDialog error:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  /**
   * ส่ง Server Action บันทึกการรับสินค้าส่วนที่เหลือ
   */
  const handleConfirmReceipt = () => {
    startTransition(async () => {
      try {
        const itemsPayload = previewRows
          .map((row) => ({
            purchaseOrderItemId: row.purchaseOrderItemId,
            receivedQuantity:
              receivedQuantities[row.purchaseOrderItemId] ??
              row.remainingQuantity,
          }))
          .filter((item) => item.receivedQuantity > 0);

        if (itemsPayload.length === 0) {
          toast.error("กรุณาระบุจำนวนสินค้าที่ได้รับอย่างน้อย 1 รายการ");
          return;
        }

        const result = await receivePurchaseOrderItems({
          purchaseOrderId: orderId,
          items: itemsPayload,
        });

        if (!result.success) {
          toast.error(result.error || "ไม่สามารถบันทึกการรับสินค้าได้");
          return;
        }

        setReceiveDialogOpen(false);
        toast.success(
          result.data?.status === "RECEIVED"
            ? "ตรวจรับสินค้าครบถ้วนเรียบร้อย ใบสั่งซื้อปิดสมบูรณ์"
            : "บันทึกการตรวจรับสินค้าเพิ่มเติมเรียบร้อย",
        );
        router.refresh();
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่รู้จัก";
        toast.error(`เกิดข้อผิดพลาด: ${msg}`);
      }
    });
  };

  /**
   * ส่ง Server Action ยุติปัญหาของขาดโดยไม่รับของ (Resolve Discrepancy)
   */
  const handleConfirmResolution = () => {
    if (!resolutionNote.trim()) {
      toast.error("กรุณาระบุบันทึกข้อตกลง / เหตุผลการยุติปัญหา");
      return;
    }

    startTransition(async () => {
      try {
        const result = await resolvePurchaseOrderDiscrepancy({
          purchaseOrderId: orderId,
          resolutionType: selectedResolutionType,
          resolutionNote: resolutionNote.trim(),
        });

        if (!result.success) {
          toast.error(result.error || "ไม่สามารถบันทึกการยุติปัญหาได้");
          return;
        }

        setResolveDialogOpen(false);
        toast.success(
          "ยุติปัญหาของขาดและปิดใบสั่งซื้อเรียบร้อย (สถานะ 'รับของแล้ว')",
        );
        router.refresh();
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่รู้จัก";
        toast.error(`เกิดข้อผิดพลาด: ${msg}`);
      }
    });
  };

  // คำนวณสรุปใน Dialog รับของ
  const totalReceivedInDialog = previewRows.reduce((sum, row) => {
    const qty =
      receivedQuantities[row.purchaseOrderItemId] ?? row.remainingQuantity;
    return sum + qty;
  }, 0);

  const totalExpenseInDialog = previewRows.reduce((sum, row) => {
    const qty =
      receivedQuantities[row.purchaseOrderItemId] ?? row.remainingQuantity;
    return sum + qty * row.unitCost;
  }, 0);

  const shortagesAfterThisRound = previewRows.reduce((sum, row) => {
    const qty =
      receivedQuantities[row.purchaseOrderItemId] ?? row.remainingQuantity;
    return sum + Math.max(0, row.remainingQuantity - qty);
  }, 0);

  const willBeFullyReceived = shortagesAfterThisRound === 0;

  return (
    <>
      <Card id="po-discrepancy-card" className="py-6 mt-6 border-amber-500/30">
        <CardHeader className="px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-500 shrink-0" />
                  รายการสินค้าค้างส่ง / ส่งไม่ครบตามใบสั่งซื้อ
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="bg-muted text-muted-foreground ml-1"
                >
                  ค้างส่ง {totalShortageQuantity} ชิ้น (
                  {outstandingItems.length} รายการ)
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                ตรวจพบรายการสินค้าที่ยังไม่ได้รับมอบครบตามยอดสั่งซื้อ
                สามารถบันทึกตรวจรับสินค้าส่วนที่เหลือ
                หรือยุติปัญหาเมื่อตกลงชดเชยเรียบร้อย
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                id="resolve-issue-btn"
                size="sm"
                variant="outline"
                onClick={() => setResolveDialogOpen(true)}
                disabled={isLoadingPreview || isPending}
                className="gap-1.5 h-8 text-muted-foreground hover:text-primary"
              >
                <ShieldAlert className="size-3.5 text-amber-500" />
                ยุติปัญหา
              </Button>
              <LoadingButton
                id="receive-remaining-btn"
                size="sm"
                onClick={handleOpenReceiveDialog}
                isLoading={isLoadingPreview}
                disabled={isPending}
                loadingText="กำลังโหลด..."
                className="gap-1.5 h-8 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <PackageCheck className="size-3.5" />
                ตรวจรับสินค้าส่วนที่เหลือ
              </LoadingButton>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 flex flex-col">
          <div className="overflow-x-auto">
            <Table id="po-discrepancy-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-left">#</TableHead>
                  <TableHead>ชื่อสินค้า</TableHead>
                  <TableHead className="text-right">สั่งซื้อ</TableHead>
                  <TableHead className="text-right">รับแล้ว</TableHead>
                  <TableHead className="text-right">ค้างส่ง (ขาด)</TableHead>
                  <TableHead className="text-right">ราคา/หน่วย</TableHead>
                  <TableHead className="text-right">มูลค่าคงค้าง</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outstandingItems.map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground text-left font-medium group-hover:text-muted-foreground transition-colors">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="text-primary font-medium">
                      {item.inventoryItemName}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground font-medium">
                      {item.receivedQuantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className="text-amber-600 font-semibold dark:text-amber-400">
                        {item.shortageQuantity} ชิ้น
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground font-medium">
                      ฿{formatCurrency(item.unitCostNum)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-primary font-bold">
                      ฿{formatCurrency(item.shortageAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* ── Footer: ยอดรวม ── */}
          <div className="mt-auto">
            <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 px-6 pt-6">
              <div className="text-xs text-muted-foreground font-medium">
                * ข้อมูลอิงตามรายการสั่งซื้อและประวัติการตรวจรับสินค้าเข้าคลัง
              </div>
              <div className="flex flex-row items-center gap-8">
                <div className="text-right">
                  <span className="text-xs font-bold text-muted-foreground block">
                    รวมจำนวนค้างส่ง
                  </span>
                  <span className="text-base font-bold text-foreground tabular-nums">
                    {totalShortageQuantity} ชิ้น
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-muted-foreground block">
                    รวมมูลค่าคงค้าง
                  </span>
                  <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
                    <span className="text-lg font-bold mr-1">฿</span>
                    {formatCurrency(totalShortageAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Dialog 1: ตรวจรับสินค้าส่วนที่เหลือ (แสดงเฉพาะรายการค้างส่ง) ── */}
      <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <DialogContent
          id="receive-remaining-dialog"
          className="sm:max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary flex items-center gap-2">
              <PackageCheck className="size-5 text-amber-500" />
              ตรวจรับสินค้าส่วนที่เหลือเข้าคลัง
            </DialogTitle>
            <DialogDescription>
              ระบุจำนวนสินค้าที่ได้รับเพิ่มในรอบนี้
              (แสดงเฉพาะรายการที่ยังค้างส่ง)
              ระบบจะอัปเดตสต็อกและบันทึกรายจ่ายตามยอดจริง
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">ชื่อสินค้า</TableHead>
                  <TableHead className="text-right">สต็อกเดิม</TableHead>
                  <TableHead className="text-right">สั่งซื้อ</TableHead>
                  <TableHead className="text-right">รับแล้ว</TableHead>
                  <TableHead className="text-right">ค้างส่ง</TableHead>
                  <TableHead className="text-center w-[140px]">
                    จำนวนที่รับรอบนี้
                  </TableHead>
                  <TableHead className="text-right">สต็อกหลังรับ</TableHead>
                  <TableHead className="text-center w-[100px]">สถานะ</TableHead>
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
                      <TableCell className="text-primary font-medium">
                        {row.inventoryItemName}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {row.currentStock}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {row.orderedQuantity}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {row.receivedQuantity}
                      </TableCell>
                      <TableCell className="text-right font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {row.remainingQuantity}
                      </TableCell>
                      <TableCell className="text-center">
                        <InputGroup className="max-w-[120px] mx-auto">
                          <InputGroupButton
                            className="px-2 h-8"
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
                            <MinusIcon size={12} />
                          </InputGroupButton>
                          <InputGroupInput
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
                            className="text-center h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <InputGroupButton
                            className="px-2 h-8"
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
                            <PlusIcon size={12} />
                          </InputGroupButton>
                        </InputGroup>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {projectedStock}
                      </TableCell>
                      <TableCell className="text-center">
                        {isShortage ? (
                          <Badge
                            variant="secondary"
                            className="text-amber-600 bg-amber-500/10 text-[11px] whitespace-nowrap"
                          >
                            ขาดอีก {shortageQty}
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-emerald-600 bg-emerald-500/10 text-[11px] whitespace-nowrap"
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

          {/* Banner สถานะหลังรับ */}
          {willBeFullyReceived ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
              <Check className="size-4 shrink-0 text-emerald-600" />
              <p className="font-semibold text-xs sm:text-sm">
                สินค้าจะได้รับครบถ้วนทุกรายการ — ใบสั่งซื้อจะเปลี่ยนสถานะเป็น{" "}
                <strong>&ldquo;รับของแล้ว&rdquo; (Received)</strong>{" "}
                และปิดรายการปัญหาทั้งหมด
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <Clock className="size-4 mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold text-xs sm:text-sm">
                  ยังคงมีสินค้าค้างส่งอีก {shortagesAfterThisRound} ชิ้น
                </p>
                <p className="text-xs text-amber-700/90 dark:text-amber-300/90 mt-0.5">
                  ใบสั่งซื้อจะยังคงอยู่ในสถานะ{" "}
                  <strong>
                    &ldquo;รับสินค้าบางส่วน&rdquo; (Partially Received)
                  </strong>{" "}
                  เพื่อรองรับการตรวจรับในรอบถัดไป
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between items-center pt-2">
            <div className="text-xs text-muted-foreground">
              ยอดรับรอบนี้:{" "}
              <strong className="text-foreground">
                {totalReceivedInDialog} ชิ้น
              </strong>{" "}
              (มูลค่า ฿{formatCurrency(totalExpenseInDialog)})
            </div>
            <div className="flex gap-2">
              <Button
                id="cancel-receive-remaining-btn"
                variant="outline"
                onClick={() => setReceiveDialogOpen(false)}
                disabled={isPending}
              >
                ยกเลิก
              </Button>
              <LoadingButton
                id="confirm-receive-remaining-btn"
                onClick={handleConfirmReceipt}
                disabled={totalReceivedInDialog <= 0}
                isLoading={isPending}
                loadingText="กำลังบันทึก…"
                className={
                  willBeFullyReceived
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-amber-600 hover:bg-amber-700 text-white"
                }
              >
                {willBeFullyReceived
                  ? "ยืนยันรับสินค้าครบถ้วน"
                  : "ยืนยันรับสินค้าเพิ่มเติม"}
              </LoadingButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog 2: ยุติปัญหาของขาด (Resolve Issue without delivery) ── */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent
          id="resolve-discrepancy-dialog"
          className="sm:max-w-xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary flex items-center gap-2">
              <ShieldAlert className="size-5 text-amber-500" />
              ยุติปัญหาของขาด
            </DialogTitle>
            <DialogDescription>
              กรณีร้านค้าไม่สามารถจัดส่งสินค้าที่ขาดได้ และตกลงชดเชยผ่านส่วนลด,
              คืนเงิน หรือยกเลิก การยุติปัญหานี้จะปิดใบสั่งซื้อเป็น
              &ldquo;รับของแล้ว&rdquo;
              โดยไม่มีการเพิ่มสต็อกหรือคิดค่าใช้จ่ายเพิ่มเติม
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* สรุปรายการสินค้าที่ค้างส่งและจะถูกยุติปัญหา */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-primary">
                <span>
                  สรุปรายการสินค้าที่จะยุติปัญหา ({outstandingItems.length}{" "}
                  รายการ)
                </span>
                <span>รวมค้างส่ง: {totalShortageQuantity} ชิ้น</span>
              </div>
              <div className="text-xs divide-y divide-border">
                {outstandingItems.map((item) => (
                  <div
                    key={item.id}
                    className="py-1.5 flex items-center justify-between"
                  >
                    <span className="font-medium text-foreground">
                      {item.inventoryItemName}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      ขาด {item.shortageQuantity} ชิ้น (฿
                      {formatCurrency(item.shortageAmount)})
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t flex items-center justify-between text-xs font-bold text-primary">
                <span>มูลค่ารวมของสินค้าที่ยุติปัญหา:</span>
                <span className="text-amber-600 dark:text-amber-400 tabular-nums">
                  ฿{formatCurrency(totalShortageAmount)}
                </span>
              </div>
            </div>

            {/* ตัวเลือกรูปแบบการยุติปัญหา (Resolution Type) */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">
                รูปแบบการยุติปัญหา <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={selectedResolutionType}
                onValueChange={(val) =>
                  setSelectedResolutionType(
                    val as PurchaseOrderManualResolutionType,
                  )
                }
                className="grid gap-2"
              >
                {PURCHASE_ORDER_MANUAL_RESOLUTION_TYPES.map((type) => {
                  const cfg = RESOLUTION_TYPE_CONFIG[type];
                  const isChecked = selectedResolutionType === type;

                  return (
                    <label
                      key={type}
                      htmlFor={`resolution-type-${type}`}
                      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                        isChecked
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <RadioGroupItem
                        id={`resolution-type-${type}`}
                        value={type}
                        className="mt-0.5"
                      />
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="text-sm font-semibold text-foreground">
                          {cfg.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {cfg.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </RadioGroup>
            </div>

            {/* บันทึกข้อตกลง / เหตุผล */}
            <div className="space-y-1.5">
              <Label
                htmlFor="resolution-note-input"
                className="text-sm font-semibold text-foreground"
              >
                บันทึกข้อตกลง / เหตุผลการยุติปัญหา{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="resolution-note-input"
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="เช่น ได้รับการโอนเงินคืน 600 บาทเข้าบัญชีบริษัทแล้ว หรือ ผู้จำหน่ายตกลงให้ส่วนลดใน PO รอบถัดไป..."
                rows={3}
                disabled={isPending}
                className="resize-none md:text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                ข้อความนี้จะถูกบันทึกเป็นประวัติ Audit Trail
                เพื่อใช้อ้างอิงการตรวจสอบภายใน
              </p>
            </div>

            {/* Warning Callout */}
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground flex items-start gap-2">
              <Info className="size-4 shrink-0 text-muted-foreground mt-0.5" />
              <p>
                เมื่อยืนยันแล้ว สถานะใบสั่งซื้อจะเปลี่ยนเป็น{" "}
                <strong className="text-foreground">
                  &ldquo;รับของแล้ว&rdquo; (Received)
                </strong>{" "}
                โดยไม่มีการเพิ่มสต็อกสินค้าคงคลัง
                และไม่มีการบันทึกค่าใช้จ่ายเพิ่มเติม
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end items-center pt-2">
            <Button
              id="cancel-resolve-issue-btn"
              variant="outline"
              onClick={() => setResolveDialogOpen(false)}
              disabled={isPending}
            >
              ยกเลิก
            </Button>
            <LoadingButton
              id="confirm-resolve-issue-btn"
              onClick={handleConfirmResolution}
              disabled={!resolutionNote.trim()}
              isLoading={isPending}
              loadingText="กำลังบันทึก…"
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
            >
              ยืนยันการยุติปัญหา
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
