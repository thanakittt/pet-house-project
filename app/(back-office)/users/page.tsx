import { auth } from "@/lib/auth";
import UserManagement from "@/modules/auth/components/UserManagement";
import { headers } from "next/headers";

export default async function UsersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div>
        <h1>Please login to continue</h1>
      </div>
    );
  }

  return <UserManagement />;
}
