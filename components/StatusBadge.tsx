"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Wallet, 
  Hourglass, 
  CalendarCheck, 
  LogIn, 
  Scissors, 
  ShoppingBag, 
  CheckCircle2, 
  XCircle, 
  UserX 
} from "lucide-react";
import { STATUS_CONFIG } from "@/modules/appointment/constants/appointment-status";

export type AppointmentStatus = 
  // 1. Booking
  | "PENDING_DEPOSIT" 
  | "PENDING_APPROVAL" 
  | "CONFIRMED" 
  // 2. Operation
  | "CHECKED_IN" 
  | "IN_PROGRESS" 
  | "READY_FOR_PICKUP" 
  // 3. Finished
  | "COMPLETED" 
  | "CANCELLED" 
  | "NO_SHOW";

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus | string;
  className?: string;
}

export function AppointmentStatusBadge({ 
  status, 
  className 
}: AppointmentStatusBadgeProps) {
  
  // Fallback กรณีหา Status ไม่เจอ
  const config = STATUS_CONFIG[status as AppointmentStatus] || {
    label: status,
    colorClass: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <Badge 
      variant="outline" 
      className={cn("flex items-center font-medium whitespace-nowrap", config.colorClass, className)}
    >
      {config.label}
    </Badge>
  );
}