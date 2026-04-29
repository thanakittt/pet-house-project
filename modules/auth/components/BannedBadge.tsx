import { BanIcon, CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BannedBadgeProps {
  banned: boolean;
}

export function BannedBadge({ banned }: BannedBadgeProps) {
  const variantMap = {
    banned: "border-red-200 bg-red-50 text-red-700",
    active: "border-green-200 bg-green-50 text-green-700",
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
