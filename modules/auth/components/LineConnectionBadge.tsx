import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LineConnectionBadgeProps {
  connected?: boolean;
}

export function LineConnectionBadge({ connected }: LineConnectionBadgeProps) {
  const config = connected
    ? {
        label: "LINE เชื่อมแล้ว",
        className:
          "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/30 dark:text-green-300",
      }
    : {
        label: "ยังไม่เชื่อม LINE",
        className:
          "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300",
      };

  return (
    <Badge
      variant="outline"
      className={cn("font-medium whitespace-nowrap", config.className)}
    >
      {config.label}
    </Badge>
  );
}
