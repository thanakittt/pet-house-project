import { requireAdmin } from "@/lib/session";
import EditUserForm from "@/modules/auth/components/EditUserForm";
import { getUserById } from "@/modules/auth/queries/get-user";
import { notFound } from "next/navigation";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const result = await getUserById(id);

  if (!result.success) {
    if (result.error === "ไม่พบผู้ใช้") {
      return notFound();
    }
    throw new Error(result.error);
  }

  return (
    <div className="flex justify-center items-center w-full min-h-screen">
      <EditUserForm user={result.data} />
    </div>
  );
}
