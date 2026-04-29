"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { BannedBadge } from "./BannedBadge";
import { RoleBadge } from "./RoleBadge";
import { Ban, CircleCheck, PencilIcon } from "lucide-react";
import { AuthUser } from "../types/user";

import BanUserDialog from "./BanUserDialog";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UserManagement({ users }: { users: AuthUser[] }) {
  const router = useRouter();
  const [isBanUserDialogOpen, setIsBanUserDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const unbanUser = async (userId: string) => {
    try {
      const { error } = await authClient.admin.unbanUser({
        userId,
      });

      if (error) {
        toast.error("เกิดข้อผิดพลาดในการยกเลิกการแบน");
        return;
      }

      toast.success("ยกเลิกการแบนผู้ใช้สำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("Unban User Error:", error);
      toast.error("เกิดข้อผิดพลาดในการยกเลิกการแบน");
    }
  };

  return (
    <div>
      <div className="flex justify-end">

        {/* create user button */}
        <Button asChild variant="default" size="default">
          <Link href="/back-office/users/create">สร้างผู้ใช้</Link>
        </Button>
      </div>

      <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>ชื่อ</TableHead>
            <TableHead>อีเมล</TableHead>
            <TableHead>เบอร์โทรศัพท์</TableHead>
            <TableHead>บทบาท</TableHead>
            <TableHead>สถานะ</TableHead>
            <TableHead className="text-right">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length > 0 ? (
            users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              {/* phoneNumber อาจเป็น null/undefined — แสดง "—" เมื่อไม่มีข้อมูล */}
              <TableCell>{user.phoneNumber ?? "—"}</TableCell>
              <TableCell>
                <RoleBadge role={user.role} />
              </TableCell>
              <TableCell>
                <BannedBadge banned={user.banned!} />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  {/* Ban/Unban user */}
                  {user.banned ? (
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="ยกเลิกการแบน"
                      onClick={() => unbanUser(user.id)}
                    >
                      <CircleCheck className="size-3.5" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="แบนผู้ใช้"
                      disabled={false}
                      onClick={() => {
                        setIsBanUserDialogOpen(true);
                        setSelectedUserId(user.id);
                      }}
                    >
                      <Ban className="size-3.5" />
                    </Button>
                  )}

                  {/* Edit user */}
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="แก้ไขข้อมูล"
                    disabled={false}
                    asChild
                  >
                    <Link href={`/back-office/users/${user.id}/edit`}>
                      <PencilIcon className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center">
                ไม่มีข้อมูล
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>

      <BanUserDialog
        userId={selectedUserId!}
        open={isBanUserDialogOpen}
        onOpenChange={setIsBanUserDialogOpen}
      />
    </div>
  );
}
