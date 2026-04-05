import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UserManagement() {
  return (
    <div>
      <Button asChild variant="default" size="default">
        <Link href="/users/create">สร้างผู้ใช้</Link>
      </Button>
    </div>
  );
}
