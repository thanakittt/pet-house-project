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
    return (
      <div className="p-6">
        <div className="flex flex-col justify-center items-center bg-muted/10 p-12 border-2 border-dashed rounded-xl text-muted-foreground">
          <h3 className="font-bold text-lg">เกิดข้อผิดพลาด</h3>
          <p className="text-sm">{result.error}</p>
        </div>
      </div>
    );
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
