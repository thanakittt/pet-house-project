import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AuthSignupProvider } from "../types/user";

interface SignupProviderBadgeProps {
  provider?: AuthSignupProvider;
}

const providerConfig: Record<
  AuthSignupProvider,
  { label: string; className: string }
> = {
  email: {
    label: "สมัคร: Email",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/30 dark:text-blue-300",
  },
  google: {
    label: "สมัคร: Google",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/30 dark:text-amber-300",
  },
  line: {
    label: "สมัคร: LINE",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  unknown: {
    label: "ไม่พบแหล่งสมัคร",
    className:
      "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300",
  },
};

export function SignupProviderBadge({ provider }: SignupProviderBadgeProps) {
  const config = providerConfig[provider ?? "unknown"];

  return (
    <Badge
      variant="outline"
      className={cn("font-medium whitespace-nowrap", config.className)}
    >
      {config.label}
    </Badge>
  );
}
