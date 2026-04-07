import { CircleCheck, BanIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BannedBadgeProps {
  banned: boolean;
}

export function BannedBadge({ banned }: BannedBadgeProps) {
  const variantMap = {
    banned: "bg-red-100 text-red-700",
    active: "bg-green-100 text-green-700",
  };

  const status = banned ? "banned" : "active";

  const options =
    status === "banned"
      ? { label: "ถูกระงับ", icon: <BanIcon /> }
      : { label: "ใช้งานปกติ", icon: <CircleCheck /> };

  return (
    <Badge className={cn(variantMap[status], "px-3 rounded-full")}>
      {options.icon} {options.label}
    </Badge>
  );
}
