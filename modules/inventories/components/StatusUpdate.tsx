"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PURCHASE_ORDER_STATUS_CONFIG,
  PURCHASE_ORDER_STATUS_KEYS,
  type PurchaseOrderStatus,
} from "@/modules/inventories/constants/purchase-order-status";
import { updatePurchaseOrderStatus } from "@/modules/inventories/actions/update-purchase-order-status";
import { Check, ChevronDown, Clock, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export default function StatusUpdate({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: PurchaseOrderStatus;
}) {
  const [localStatus, setLocalStatus] =
    useState<PurchaseOrderStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const config = PURCHASE_ORDER_STATUS_CONFIG[localStatus];
  const groups = ["Not Started", "Active", "Closed"] as const;

  const handleStatusChange = (newStatus: PurchaseOrderStatus) => {
    if (newStatus === localStatus) return;

    const prevStatus = localStatus;
    setLocalStatus(newStatus);

    startTransition(async () => {
      const result = await updatePurchaseOrderStatus(orderId, newStatus);

      if (!result.success) {
        setLocalStatus(prevStatus);
        toast.error(result.error);
        return;
      }

      toast.success("อัปเดตสถานะใบสั่งซื้อเรียบร้อย");
      router.refresh();
    });
  };

  return (
    <ButtonGroup>
      <Button
        variant="ghost"
        size="lg"
        className={`${config.color} w-28 md:w-32`}
        disabled={isPending || config.next === null}
        onClick={() => config.next && handleStatusChange(config.next)}
      >
        {config.title}
      </Button>

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
          className="z-50 w-56 rounded-xl border-slate-200 bg-white p-2 shadow-xl"
        >
          {groups.map((group) => {
            const groupItems = PURCHASE_ORDER_STATUS_KEYS.filter(
              (key) => PURCHASE_ORDER_STATUS_CONFIG[key].group === group,
            );

            if (groupItems.length === 0) return null;

            return (
              <div key={group} className="mb-2 last:mb-0">
                <div className="flex items-center px-2 py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
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
                          ? "bg-slate-50 font-bold text-slate-900"
                          : "text-slate-600 hover:bg-slate-50"
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
  );
}
