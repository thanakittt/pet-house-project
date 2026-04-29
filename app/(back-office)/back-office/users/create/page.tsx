import { requireAdmin } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function CreateUserPage() {
  await requireAdmin();
  redirect("/back-office/users");
}
