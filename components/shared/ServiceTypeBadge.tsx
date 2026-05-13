import { Badge } from "@/components/ui/badge";
import { SERVICE_TYPE_LABELS } from "@/lib/constants/service-type";
import { cn } from "@/lib/utils";

type KnownServiceType = "MAIN" | "ADDON";

interface ServiceTypeBadgeProps {
  serviceType: string | null | undefined;
  className?: string;
}

const serviceTypeBadgeConfig: Record<
  KnownServiceType,
  { label: string; className: string }
> = {
  MAIN: {
    label: SERVICE_TYPE_LABELS.MAIN,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  ADDON: {
    label: SERVICE_TYPE_LABELS.ADDON,
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/30 dark:text-amber-300",
  },
};

function normalizeServiceType(
  serviceType: string | null | undefined,
): KnownServiceType | null {
  if (!serviceType) {
    return null;
  }

  const normalizedServiceType = serviceType.toUpperCase();

  if (normalizedServiceType === "MAIN" || normalizedServiceType === "ADDON") {
    return normalizedServiceType;
  }

  return null;
}

export function ServiceTypeBadge({
  serviceType,
  className,
}: ServiceTypeBadgeProps) {
  // รวมการแสดงผลประเภทบริการไว้ที่เดียว เพื่อให้ทุกหน้าที่ใช้ badge มีสีและ wording เหมือนกัน
  const normalizedServiceType = normalizeServiceType(serviceType);
  const config = normalizedServiceType
    ? serviceTypeBadgeConfig[normalizedServiceType]
    : null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium whitespace-nowrap",
        config?.className ?? "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      {config?.label ?? "อื่นๆ"}
    </Badge>
  );
}
