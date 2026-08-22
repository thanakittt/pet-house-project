import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils"; // สมมติว่าใช้มาตรฐานของ shadcn/ui

interface RoleBadgeProps {
  role: string | undefined;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  // 1. สร้าง Mapping สำหรับข้อความและสไตล์
  const roleConfig: Record<string, { label: string; className: string }> = {
    admin: {
      label: "ผู้ดูแลระบบ",
      className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400",
    },
    staff: {
      label: "พนักงาน",
      className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
    },
    owner: {
      label: "เจ้าของ",
      className: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400",
    },
    customer: {
      label: "ลูกค้า",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
  };

  // 2. กำหนดค่าเริ่มต้นหากไม่พบ Role
  const config = (role && roleConfig[role]) || {
    label: "ไม่พบข้อมูล",
    className: "bg-muted text-muted-foreground",
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