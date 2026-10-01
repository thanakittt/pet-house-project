"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Badge } from "@/components/ui/badge";
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
import { Check, ChevronDown, Clock, Loader2, X } from "lucide-react";
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

  /**
   * เมื่อ newStatus === "RECEIVED" → ดึง preview ก่อน แล้วค่อยเปิด dialog
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

  /** ยืนยัน dialog → commit RECEIVED */
  const handleConfirmReceive = () => {
    setDialogOpen(false);
    commitStatusChange("RECEIVED");
  };

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
                        className={`mb-0.5 flex cursor-pointer items-center justify-between rounded-md px-2 py-2 ${isSelected
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

      {/* Dialog ยืนยันการรับของ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>ยืนยันการรับสินค้า</DialogTitle>
            <DialogDescription>
              ตรวจสอบรายการสินค้าที่จะถูกเพิ่มเข้าสต็อกหลังยืนยัน
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[40%]">ชื่อสินค้า</TableHead>
                  <TableHead className="text-right">stock เดิม</TableHead>
                  <TableHead className="text-right">จำนวนที่สั่ง</TableHead>
                  <TableHead className="text-right font-semibold">
                    ผลลัพธ์
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row) => (
                  <TableRow key={row.inventoryItemId}>
                    <TableCell className="font-medium">
                      {row.inventoryItemName}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.currentStock}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-medium">
                      +{row.orderedQuantity}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {row.resultStock}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleConfirmReceive}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-2" />
                  กำลังบันทึก…
                </>
              ) : (
                "ยืนยันรับของ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
