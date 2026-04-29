"use client";

import { Button } from "@/components/ui/button";
import {
  BanIcon,
  CircleCheckIcon,
  EyeIcon,
  Loader2Icon,
  PencilIcon,
  SettingsIcon,
  TrashIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type * as React from "react";

type TableActionButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "children"
> & {
  icon: LucideIcon;
  isLoading?: boolean;
};

type TableActionLinkProps = Omit<
  React.ComponentProps<typeof Button>,
  "asChild" | "children" | "onClick"
> & {
  href: string;
  icon: LucideIcon;
};

export const TABLE_ACTION_ICONS = {
  ban: BanIcon,
  delete: TrashIcon,
  edit: PencilIcon,
  manage: SettingsIcon,
  unban: CircleCheckIcon,
  view: EyeIcon,
} as const satisfies Record<string, LucideIcon>;

function ActionIcon({
  icon: Icon,
  isLoading,
}: {
  icon: LucideIcon;
  isLoading?: boolean;
}) {
  const IconComponent = isLoading ? Loader2Icon : Icon;

  return (
    <IconComponent
      data-icon="inline-start"
      className={isLoading ? "animate-spin" : undefined}
    />
  );
}

export function TableActionButton({
  icon,
  isLoading,
  size = "icon",
  variant = "outline",
  ...props
}: TableActionButtonProps) {
  return (
    <Button variant={variant} size={size} {...props}>
      <ActionIcon icon={icon} isLoading={isLoading} />
    </Button>
  );
}

export function TableActionLink({
  href,
  icon,
  size = "icon",
  variant = "outline",
  ...props
}: TableActionLinkProps) {
  return (
    <Button variant={variant} size={size} asChild {...props}>
      <Link href={href}>
        <ActionIcon icon={icon} />
      </Link>
    </Button>
  );
}
