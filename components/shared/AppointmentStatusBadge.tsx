import { Badge } from "@/components/ui/badge";
import { getAppointmentStatusConfig } from "@/lib/constants/appointment-status";
import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/modules/appointment/types/status";
import type { ReactNode } from "react";
import {
  CheckCircle2,
  Clock4,
  Flag,
  LogIn,
  PackageCheck,
  RefreshCw,
  UserX,
  Wallet,
  XCircle,
} from "lucide-react";

type AppointmentStatusBadgeSize = "sm" | "md" | "lg";

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus | string;
  className?: string;
  size?: AppointmentStatusBadgeSize;
  withIcon?: boolean;
}

const STATUS_ICONS: Record<AppointmentStatus, ReactNode> = {
  PENDING_DEPOSIT: <Wallet size={14} />,
  PENDING_APPROVAL: <Clock4 size={14} />,
  CONFIRMED: <CheckCircle2 size={14} />,
  CHECKED_IN: <LogIn size={14} />,
  IN_PROGRESS: <RefreshCw size={14} className="animate-spin-slow" />,
  READY_FOR_PICKUP: <PackageCheck size={14} />,
  COMPLETED: <Flag size={14} />,
  CANCELLED: <XCircle size={14} />,
  NO_SHOW: <UserX size={14} />,
};

const sizeClassNames: Record<AppointmentStatusBadgeSize, string> = {
  sm: "px-2.5 py-1 text-[11px] leading-tight", // เพิ่ม py เป็น 1 และแก้ leading ให้มีพื้นที่สระ
  md: "px-3 py-1.5 text-xs leading-tight",     // เพิ่ม py เป็น 1.5 
  lg: "px-4 py-2 text-sm leading-tight",       // เพิ่ม py เป็น 2 
};

function isKnownAppointmentStatus(status: string): status is AppointmentStatus {
  return status in STATUS_ICONS;
}

/** Badge แสดงสถานะนัดหมาย ใช้ label และสีจาก config กลางเพียงจุดเดียว */
export function AppointmentStatusBadge({
  status,
  className,
  size = "sm",
  withIcon = false,
}: AppointmentStatusBadgeProps) {
  const config = getAppointmentStatusConfig(status);
  const icon =
    withIcon && isKnownAppointmentStatus(status) ? STATUS_ICONS[status] : null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        config.colorClass,
        sizeClassNames[size],
        className,
      )}
    >
      {icon}
      {config.label}
    </Badge>
  );
}
