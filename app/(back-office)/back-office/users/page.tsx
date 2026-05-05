import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { requireAdmin } from "@/lib/session";
import UserManagement from "@/modules/auth/components/UserManagement";
import {
  listUsers,
  parseUserPage,
  parseUserRoleFilter,
} from "@/modules/auth/queries/list-users";

export const metadata: Metadata = {
  title: "จัดการผู้ใช้",
  description: "จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึงระบบหลังร้าน",
};

type UsersPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    role?: string;
  }>;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  await requireAdmin();

  const query = await searchParams;
  const userList = await listUsers({
    page: parseUserPage(query.page),
    q: query.q,
    role: parseUserRoleFilter(query.role),
  });

  return (
    <>
      <SiteHeader title="จัดการผู้ใช้" />
      <div className="p-6">
        <UserManagement {...userList} />
      </div>
    </>
  );
}
