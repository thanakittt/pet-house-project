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
      <div className="flex justify-between ">
        <h1 className="text-2xl font-bold">จัดการผู้ใช้</h1>

        {/* create user button */}
        <Button asChild variant="default" size="default">
          <Link href="/users/create">สร้างผู้ใช้</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
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
          {users.map((user) => (
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
                <div className="flex gap-1 justify-end">
                  {/* Ban/Unban user */}
                  {user.banned ? (
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="ยกเลิกการแบน"
                      disabled={false}
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
                    <Link href={`/users/${user.id}/edit`}>
                      <PencilIcon className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <BanUserDialog
        userId={selectedUserId!}
        setIsBanUserDialogOpen={setIsBanUserDialogOpen}
        isBanUserDialogOpen={isBanUserDialogOpen}
      />
    </div>
  );
}
