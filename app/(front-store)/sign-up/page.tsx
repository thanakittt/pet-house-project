import { requireCustomer } from "@/lib/session";
import { SignUpForm } from "@/modules/auth/components/SignUpForm";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
  const session = await requireCustomer({ redirect: false });
  if (session) {
    redirect("/");
  }
  return <SignUpForm />;
}
