import { requireCustomer } from "@/lib/session";
import { SignInForm } from "@/modules/auth/components/SignInForm";
import { redirect } from "next/navigation";

export default async function SignIn() {
  const session = await requireCustomer({ redirect: false });
  if (session) {
    redirect("/");
  }
  return <SignInForm />;
}
