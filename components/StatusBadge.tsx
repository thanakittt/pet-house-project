import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/constants/appointment-status";
import type { AppointmentStatus } from "@/modules/appointment/types/status";

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus | string;
  className?: string;
}

/** Badge แสดงสถานะนัดหมาย — ใช้สีและ label จาก STATUS_CONFIG */
export function AppointmentStatusBadge({
  status,
  className,
}: AppointmentStatusBadgeProps) {
  // Fallback กรณีหา Status ไม่เจอ
  const config = STATUS_CONFIG[status as AppointmentStatus] || {
    label: status,
    colorClass: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center font-medium whitespace-nowrap",
        config.colorClass,
        className,
      )}
    >
      {config.label}
    </Badge>
  );
}
