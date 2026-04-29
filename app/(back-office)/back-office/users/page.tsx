import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/session";
import { SiteHeader } from "@/components/site-header";
import UserManagement from "@/modules/auth/components/UserManagement";
import { AuthUser } from "@/modules/auth/types/user";
import { headers } from "next/headers";

export default async function UsersPage() {
  await requireAdmin();

  const { users } = await auth.api.listUsers({
    query: {},
    headers: await headers(),
  });

  return (
    <>
      <SiteHeader title="จัดการผู้ใช้" />
      <div className="p-6">
        <UserManagement users={users as AuthUser[]} />
      </div>
    </>
  );
}
