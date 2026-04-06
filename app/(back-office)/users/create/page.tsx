import { requireAdmin } from "@/lib/session";
import CreateUserForm from "@/modules/auth/components/CreateUserForm";

export default async function CreateUserPage() {
  await requireAdmin();

  return (
    <div className="flex justify-center items-center min-h-screen">
      <CreateUserForm />
    </div>
  );
}
