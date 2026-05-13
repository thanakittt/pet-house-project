import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CustomerChannel = "ONLINE" | "WALK_IN";

interface CustomerChannelBadgeProps {
  channel: CustomerChannel;
  className?: string;
}

const customerChannelConfig: Record<
  CustomerChannel,
  { label: string; className: string }
> = {
  ONLINE: {
    label: "Online",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/30 dark:text-blue-300",
  },
  WALK_IN: {
    label: "Walk-in",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/30 dark:text-amber-300",
  },
};

export function CustomerChannelBadge({
  channel,
  className,
}: CustomerChannelBadgeProps) {
  // แยก config ไว้ที่เดียว เพื่อให้ทุกหน้าที่แสดงช่องทางลูกค้าใช้ wording และสีเดียวกัน
  const config = customerChannelConfig[channel];

  return (
    <Badge
      variant="outline"
      className={cn("font-medium whitespace-nowrap", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
