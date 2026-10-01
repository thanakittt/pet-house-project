"use client";

import {
  CheckCircle2,
  PlusCircle,
  Trash2,
  ArrowRightLeft,
  Package,
  Store,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatThaiDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { PurchaseOrderLogEntry } from "../queries/get-purchase-order-logs";
import { PURCHASE_ORDER_STATUS_CONFIG } from "../constants/purchase-order-status";

// ── Config ต่อ event type ──
const EVENT_CONFIG: Record<
  PurchaseOrderLogEntry["event"],
  {
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    iconBg: string;
    iconColor: string;
  }
> = {
  CREATED: {
    label: "สร้างใบสั่งซื้อ",
    icon: PlusCircle,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  STATUS_CHANGED: {
    label: "เปลี่ยนสถานะ",
    icon: ArrowRightLeft,
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  ITEMS_UPDATED: {
    label: "แก้ไขรายการสินค้า",
    icon: Package,
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  VENDOR_UPDATED: {
    label: "แก้ไขข้อมูลผู้จำหน่าย",
    icon: Store,
    iconBg: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
  },
  DELETED: {
    label: "ลบใบสั่งซื้อ",
    icon: Trash2,
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
  },
};

interface StatusBadgeProps {
  status: string;
  variant?: "from" | "to";
}

function StatusBadge({ status, variant = "from" }: StatusBadgeProps) {
  const config =
    PURCHASE_ORDER_STATUS_CONFIG[
      status as keyof typeof PURCHASE_ORDER_STATUS_CONFIG
    ];
  if (!config) return <span className="text-sm font-medium">{status}</span>;

  return (
    <Badge
      className={cn(
        "text-xs px-2 py-0.5 rounded-full",
        config.color,
        variant === "to" && "ring-2 ring-offset-1 ring-current/20",
      )}
    >
      {config.title}
    </Badge>
  );
}

interface PurchaseOrderTimelineProps {
  logs: PurchaseOrderLogEntry[];
}

export default function PurchaseOrderTimeline({
  logs,
}: PurchaseOrderTimelineProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
        <Clock size={40} className="opacity-30" />
        <p className="text-sm font-medium">ยังไม่มีประวัติสำหรับใบสั่งซื้อนี้</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* ── Vertical line ── */}
      <div className="absolute left-5 top-5 bottom-5 w-px bg-border" />

      <ol className="space-y-6">
        {logs.map((log, idx) => {
          const config = EVENT_CONFIG[log.event];
          const Icon = config.icon;
          const isLast = idx === logs.length - 1;

          return (
            <li key={log.id} className="relative flex items-start gap-4">
              {/* ── Icon ── */}
              <div
                className={cn(
                  "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  config.iconBg,
                )}
              >
                <Icon size={18} className={config.iconColor} />
              </div>

              {/* ── Content ── */}
              <div
                className={cn(
                  "flex-1 rounded-xl border bg-card px-4 py-3 shadow-sm",
                  isLast && "border-primary/20",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-primary">
                    {config.label}
                  </span>
                  <time className="text-xs text-muted-foreground tabular-nums">
                    {formatThaiDateTime(log.createdAt)}
                  </time>
                </div>

                {/* ── Note ── */}
                {log.note && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {log.note}
                  </p>
                )}

                {/* ── Status transition ── */}
                {log.event === "STATUS_CHANGED" &&
                  log.fromStatus &&
                  log.toStatus && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <StatusBadge status={log.fromStatus} variant="from" />
                      <ArrowRightLeft
                        size={14}
                        className="text-muted-foreground shrink-0"
                      />
                      <StatusBadge status={log.toStatus} variant="to" />
                    </div>
                  )}

                {/* ── Staff ── */}
                <div className="mt-2 flex items-center gap-1.5">
                  <CheckCircle2
                    size={12}
                    className="text-muted-foreground shrink-0"
                  />
                  <span className="text-xs text-muted-foreground">
                    โดย{" "}
                    <span className="font-medium text-foreground">
                      {log.staffNickname}
                    </span>
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
