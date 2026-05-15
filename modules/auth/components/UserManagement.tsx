"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ManagementListControls,
  ManagementPagination,
  type ManagementFilterOption,
} from "@/components/shared/ManagementListControls";
import { TableActionButton } from "@/components/shared/TableActionButton";
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
import type { AuthUserWithProfile } from "../types/user";
import type {
  ListUsersResult,
  UserRoleFilter,
} from "@/modules/auth/queries/list-users";
import BanUserDialog from "./BanUserDialog";
import { CreateUserDialog } from "./CreateUserDialog";
import { UpdateUserDialog } from "./UpdateUserDialog";
import { authClient } from "@/lib/auth-client";
import { getUserById } from "../queries/get-user";
import { formatPhoneNumber } from "@/lib/utils";

const roleOptions: Array<ManagementFilterOption & { value: UserRoleFilter }> = [
  { value: "ALL", label: "ทุกบทบาท" },
  { value: "admin", label: "ผู้ดูแลระบบ" },
  { value: "owner", label: "เจ้าของร้าน" },
  { value: "staff", label: "พนักงาน" },
  { value: "customer", label: "ลูกค้า" },
];

export default function UserManagement({
  users,
  total,
  page,
  pageSize,
  totalPages,
  q,
  role,
}: ListUsersResult) {
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
      <ManagementListControls
        search={{
          ariaLabel: "ค้นหาผู้ใช้",
          placeholder: "ค้นหาชื่อ อีเมล หรือเบอร์โทรศัพท์",
          value: q,
        }}
        selectFilters={[
          {
            ariaLabel: "กรองบทบาท",
            name: "role",
            options: roleOptions,
            placeholder: "บทบาท",
            value: role,
          },
        ]}
        createAction={<CreateUserDialog />}
        createActionDesktopOnly
      />

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
                  <TableCell>{formatPhoneNumber(user.phoneNumber, "—")}</TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>
                    <BannedBadge banned={user.banned!} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {user.banned ? (
                        <TableActionButton
                          aria-label="ยกเลิกการแบน"
                          action="unban"
                          desktopOnly
                          onClick={() => unbanUser(user.id)}
                        />
                      ) : (
                        <TableActionButton
                          aria-label="แบนผู้ใช้"
                          action="ban"
                          desktopOnly
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setIsBanUserDialogOpen(true);
                          }}
                        />
                      )}

                      <TableActionButton
                        aria-label="แก้ไขข้อมูล"
                        action="edit"
                        desktopOnly
                        disabled={loadingUserId === user.id}
                        isLoading={loadingUserId === user.id}
                        onClick={() => handleEditUser(user.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center">
                  ไม่พบข้อมูลผู้ใช้
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ManagementPagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
      />

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
