import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/session";
import UserManagement from "@/modules/auth/components/UserManagement";
import { AuthUser } from "@/modules/auth/types/user";
import { headers } from "next/headers";

export default async function UsersPage() {
  await requireAdmin();

  const { users } = await auth.api.listUsers({
    query: {},
    headers: await headers(),
  });

  return <UserManagement users={users as AuthUser[]} />;
}
