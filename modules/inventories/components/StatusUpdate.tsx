"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown, Clock, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { toast } from "sonner";
import {
  PURCHASE_ORDER_STATUS_CONFIG,
  PURCHASE_ORDER_STATUS_KEYS,
  PurchaseOrderStatus,
} from "@/modules/inventories/constants/purchase-order-status";
import { updatePurchaseOrderStatus } from "@/modules/inventories/actions/update-purchase-order-status";

/**
 * StatusUpdate — แสดงและเปลี่ยนสถานะใบสั่งซื้อ
 * ออกแบบเป็น ButtonGroup: [ปุ่มสถานะปัจจุบัน | Dropdown ทุกสถานะ] + [ปุ่ม Quick Complete]
 *
 * @param orderId   - UUID ของ purchase_order ที่จะอัปเดต
 * @param currentStatus - สถานะปัจจุบันจาก DB
 */
export default function StatusUpdate({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: PurchaseOrderStatus;
}) {
  // ใช้ optimistic local state เพื่อ UI ตอบสนองทันที
  const [localStatus, setLocalStatus] =
    useState<PurchaseOrderStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  const config = PURCHASE_ORDER_STATUS_CONFIG[localStatus];

  // กลุ่มสำหรับจัดหมวด dropdown
  const groups = ["Not Started", "Active", "Closed"] as const;

  /**
   * handleStatusChange — เรียก server action และ rollback ถ้าเกิด error
   */
  const handleStatusChange = (newStatus: PurchaseOrderStatus) => {
    // ไม่ต้องทำอะไรถ้าเลือกสถานะเดิม
    if (newStatus === localStatus) return;

    // บันทึก prev state เผื่อ rollback
    const prevStatus = localStatus;

    // อัปเดต UI ทันที (optimistic)
    setLocalStatus(newStatus);

    startTransition(async () => {
      const result = await updatePurchaseOrderStatus(orderId, newStatus);

      if (!result.success) {
        // rollback ถ้า server ปฏิเสธ
        setLocalStatus(prevStatus);
        toast.error(result.error);
      } else {
        toast.success("อัปเดตสถานะใบสั่งซื้อเรียบร้อย");
      }
    });
  };

  return (
    <>
      {/* ─── ButtonGroup: ปุ่มสถานะ + Dropdown ─── */}
      <ButtonGroup>
        {/* ปุ่มหลัก: กด = advance ไปสถานะถัดไป */}
        <Button
          variant="ghost"
          size="lg"
          className={config.color + " w-28 md:w-32"}
          disabled={isPending || config.next === null}
          onClick={() => config.next && handleStatusChange(config.next)}
        >
          {config.title}
        </Button>

        {/* Dropdown: เลือกสถานะได้อิสระ (ตามที่ transition rules อนุญาต) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="lg"
              className={config.color}
              disabled={isPending}
            >
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className="w-56 p-2 rounded-xl bg-white shadow-xl border-slate-200 z-50"
          >
            {groups.map((group) => {
              // กรองเฉพาะ status ที่อยู่ใน group นี้
              const groupItems = PURCHASE_ORDER_STATUS_KEYS.filter(
                (key) => PURCHASE_ORDER_STATUS_CONFIG[key].group === group,
              );

              if (groupItems.length === 0) return null;

              return (
                <div key={group} className="mb-2 last:mb-0">
                  {/* หัวข้อกลุ่ม */}
                  <div className="flex items-center px-2 py-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
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
                        className={`
                          flex items-center justify-between px-2 py-2 rounded-md cursor-pointer mb-0.5
                          ${isSelected ? "bg-slate-50 text-slate-900 font-bold" : "text-slate-600 hover:bg-slate-50"}
                        `}
                      >
                        <div className="flex items-center gap-2">
                          {/* วงกลมแสดงสถานะ */}
                          <div
                            className={`
                              size-5 rounded-full border-2 flex items-center justify-center
                              ${itemConfig.dot}
                            `}
                          >
                            {key === "ORDERED" && (
                              <Clock size={10} className="text-white p-0.5" />
                            )}
                            {key === "RECEIVED" && (
                              <Check size={10} className="text-white p-0.5" />
                            )}
                            {key === "CANCELLED" && (
                              <X size={10} className="text-white p-0.5" />
                            )}
                          </div>
                          <span className="text-sm uppercase tracking-wide">
                            {itemConfig.title}
                          </span>
                        </div>

                        {/* checkmark ถ้าเป็นสถานะปัจจุบัน */}
                        {isSelected && (
                          <Check size={14} className="text-blue-500" />
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
    </>
  );
}
