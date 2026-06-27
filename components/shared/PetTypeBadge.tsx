import { Badge } from "@/components/ui/badge";
import { PET_TYPE_LABELS } from "@/lib/constants/pet-type";
import { cn } from "@/lib/utils";
import { CatIcon, DogIcon, HelpCircleIcon, type LucideIcon } from "lucide-react";

type KnownPetType = "DOG" | "CAT";
type PetTypeBadgeDisplay = "inline" | "tile";

interface PetTypeBadgeProps {
  type: string | null | undefined;
  className?: string;
  display?: PetTypeBadgeDisplay;
}

type PetTypeBadgeConfig = {
  icon: LucideIcon;
  className: string;
};

const petTypeBadgeConfig: Record<KnownPetType, PetTypeBadgeConfig> = {
  DOG: {
    icon: DogIcon,
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/30 dark:text-blue-300",
  },
  CAT: {
    icon: CatIcon,
    className:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-900/30 dark:text-orange-300",
  },
};

function normalizePetType(type: string | null | undefined): KnownPetType | null {
  if (!type) {
    return null;
  }

  const normalizedType = type.toUpperCase();

  if (normalizedType === "DOG" || normalizedType === "CAT") {
    return normalizedType;
  }

  return null;
}

export function PetTypeBadge({
  type,
  className,
  display = "inline",
}: PetTypeBadgeProps) {
  // แปลงค่าให้เป็นรูปแบบกลางก่อน เพื่อให้ component นี้ใช้ได้ทั้งค่า "DOG" และ "dog"
  const normalizedType = normalizePetType(type);
  const config = normalizedType ? petTypeBadgeConfig[normalizedType] : null;
  const Icon = config?.icon ?? HelpCircleIcon;
  const label = normalizedType ? PET_TYPE_LABELS[normalizedType] : "ไม่ระบุ";

  if (display === "tile") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "size-16 flex-col gap-1 rounded-md font-bold",
          config?.className ??
            "border-border bg-muted text-muted-foreground",
          className,
        )}
      >
        <Icon />
        <span className="text-sm leading-none">{label}</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium whitespace-nowrap",
        config?.className ?? "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      <Icon data-icon="inline-start" />
      {label}
    </Badge>
  );
}
