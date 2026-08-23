import { getSession } from "@/lib/session";
import { isConnected } from "@/modules/line/actions/connect-line";
import ConnectLinePage from "@/modules/customer/components/front-store/connectLinePage";
import { LIFFSignInForm } from "@/modules/customer/components/front-store/LIFFSignInForm";

const CONNECT_LINE_ROLES = ["customer", "staff", "admin", "owner"];

export default async function Page() {
  const session = await getSession();
  const role = session?.user.role;

  if (!session || !role || !CONNECT_LINE_ROLES.includes(role)) {
    return <LIFFSignInForm />;
  }

  const result = await isConnected();

  return <ConnectLinePage isConnected={result.success ? result.data : false} />;
}
