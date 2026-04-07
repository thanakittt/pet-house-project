import { Badge } from "@/components/ui/badge";

interface RoleBadgeProps {
  role: string | undefined;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  let thaiRole = "";

  switch (role) {
    case "admin":
      thaiRole = "ผู้ดูแลระบบ";
      break;
    case "staff":
      thaiRole = "พนักงาน";
      break;
    case "owner":
      thaiRole = "เจ้าของ";
      break;
    case "customer":
      thaiRole = "ลูกค้า";
      break;
    default:
      thaiRole = "ไม่พบข้อมูล";
      break;
  }

  return (
    <Badge variant="outline" className="bg-muted px-3 rounded-md">
      {thaiRole}
    </Badge>
  );
}
