import { getWaitingPayments } from "@/modules/pos/queries/get-waiting-payments";
import { WaitingPaymentList } from "@/modules/pos/components/WaitingPaymentList";
import { requireStaff } from "@/lib/session";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "POS - รายการรอชำระเงิน",
};

export default async function POSWaitingPaymentPage() {
  await requireStaff();

  const result = await getWaitingPayments();

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <>
      <SiteHeader title="POS - รายการรอชำระเงิน" />

      <div className="mx-auto p-6 w-full max-w-7xl">
        <WaitingPaymentList appointments={result.data || []} />
      </div>
    </>
  );
}
