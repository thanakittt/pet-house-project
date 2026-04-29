import { requireAdmin } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  await params;
  redirect("/back-office/users");
}
