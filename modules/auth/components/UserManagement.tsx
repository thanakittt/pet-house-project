"use client";

import { Button } from "@/components/ui/button";
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
import { Ban, CircleCheck, Loader2Icon, PencilIcon } from "lucide-react";
import { AuthUser, AuthUserWithProfile } from "../types/user";

import BanUserDialog from "./BanUserDialog";
import { CreateUserDialog } from "./CreateUserDialog";
import { UpdateUserDialog } from "./UpdateUserDialog";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getUserById } from "../queries/get-user";

export default function UserManagement({ users }: { users: AuthUser[] }) {
  const router = useRouter();
  const [isBanUserDialogOpen, setIsBanUserDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AuthUserWithProfile | null>(
    null,
  );
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

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

  const handleEditUser = async (userId: string) => {
    try {
      setLoadingUserId(userId);

      const result = await getUserById(userId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setSelectedUser(result.data);
      setIsUpdateDialogOpen(true);
    } catch (error) {
      console.error("Get User Error:", error);
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้");
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <>
      <div className="justify-between items-center gap-3 grid grid-cols-2 mb-5">
        <div className="flex items-center gap-3"></div>
        <div className="flex justify-end">
          <CreateUserDialog />
        </div>
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
                  <TableCell>{user.phoneNumber ?? "—"}</TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>
                    <BannedBadge banned={user.banned!} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setIsBanUserDialogOpen(true);
                          }}
                        >
                          <Ban className="size-3.5" />
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="แก้ไขข้อมูล"
                        disabled={loadingUserId === user.id}
                        onClick={() => handleEditUser(user.id)}
                      >
                        {loadingUserId === user.id ? (
                          <Loader2Icon className="size-3.5 animate-spin" />
                        ) : (
                          <PencilIcon className="size-3.5" />
                        )}
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
        userId={selectedUserId ?? ""}
        open={isBanUserDialogOpen}
        onOpenChange={setIsBanUserDialogOpen}
      />

      {selectedUser && (
        <UpdateUserDialog
          open={isUpdateDialogOpen}
          onOpenChange={setIsUpdateDialogOpen}
          user={selectedUser}
        />
      )}
    </>
  );
}
