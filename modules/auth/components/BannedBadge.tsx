import { BanIcon, CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BannedBadgeProps {
  banned: boolean;
}

export function BannedBadge({ banned }: BannedBadgeProps) {
  const variantMap = {
    banned: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
    active: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  };

  const status = banned ? "banned" : "active";

  const options =
    status === "banned"
      ? { label: "ถูกระงับ", icon: <BanIcon /> }
      : { label: "ใช้งานปกติ", icon: <CircleCheck /> };

  return (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-1 font-medium whitespace-nowrap",
        variantMap[status],
      )}
    >
      {options.icon} {options.label}
    </Badge>
  );
}
