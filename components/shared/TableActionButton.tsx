"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  BanIcon,
  CircleCheckIcon,
  EyeIcon,
  PencilIcon,
  SettingsIcon,
  TrashIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type * as React from "react";

type TableAction = "ban" | "delete" | "edit" | "manage" | "unban" | "view";

type TableActionButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "children"
> & {
  action: TableAction;
  icon?: LucideIcon;
  isLoading?: boolean;
};

type TableActionLinkProps = Omit<
  React.ComponentProps<typeof Button>,
  "asChild" | "children" | "onClick"
> & {
  action: TableAction;
  href: string;
  icon?: LucideIcon;
};

export const TABLE_ACTION_ICONS = {
  ban: BanIcon,
  delete: TrashIcon,
  edit: PencilIcon,
  manage: SettingsIcon,
  unban: CircleCheckIcon,
  view: EyeIcon,
} as const satisfies Record<string, LucideIcon>;

export const TABLE_ACTION_CONFIG = {
  ban: {
    icon: TABLE_ACTION_ICONS.ban,
    className:
      "border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30",
  },
  delete: {
    icon: TABLE_ACTION_ICONS.delete,
    className:
      "border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30",
  },
  edit: {
    icon: TABLE_ACTION_ICONS.edit,
    className:
      "border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-200 hover:text-blue-800 focus-visible:border-blue-400 focus-visible:ring-blue-500/20 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/50",
  },
  manage: {
    icon: TABLE_ACTION_ICONS.manage,
    className:
      "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-secondary-foreground",
  },
  unban: {
    icon: TABLE_ACTION_ICONS.unban,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 focus-visible:border-emerald-400 focus-visible:ring-emerald-500/20 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50",
  },
  view: {
    icon: TABLE_ACTION_ICONS.view,
    className:
      "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-secondary-foreground",
  },
} as const satisfies Record<
  TableAction,
  {
    icon: LucideIcon;
    className: string;
  }
>;

function ActionIcon({
  icon: Icon,
  isLoading,
}: {
  icon: LucideIcon;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return <Spinner data-icon="inline-start" />;
  }

  return <Icon data-icon="inline-start" />;
}

export function TableActionButton({
  action,
  className,
  icon,
  isLoading,
  size = "icon",
  variant = "outline",
  ...props
}: TableActionButtonProps) {
  const config = TABLE_ACTION_CONFIG[action];

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(config.className, className)}
      {...props}
      aria-busy={isLoading}
      disabled={props.disabled || isLoading}
    >
      <ActionIcon icon={icon ?? config.icon} isLoading={isLoading} />
    </Button>
  );
}

export function TableActionLink({
  action,
  className,
  href,
  icon,
  size = "icon",
  variant = "outline",
  ...props
}: TableActionLinkProps) {
  const config = TABLE_ACTION_CONFIG[action];

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(config.className, className)}
      asChild
      {...props}
    >
      <Link href={href}>
        <ActionIcon icon={icon ?? config.icon} />
      </Link>
    </Button>
  );
}
