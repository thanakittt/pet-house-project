import { requireCustomer } from "@/lib/session";
import { isConnected } from "@/modules/customer/actions/connect-line";
import ConnectLinePage from "@/modules/customer/components/front-store/connectLinePage";
import { LIFFSignInForm } from "@/modules/customer/components/front-store/LIFFSignInForm";

export default async function Page() {
  const session = await requireCustomer({ redirect: false });

  if (!session) return <LIFFSignInForm />;

  const result = await isConnected();

  return <ConnectLinePage isConnected={result.data || false} />;
}
