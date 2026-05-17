import type { Metadata } from "next";
import { getWaitingPayments } from "@/modules/pos/queries/get-waiting-payments";
import { WaitingPaymentList } from "@/modules/pos/components/WaitingPaymentList";
import { requireStaff } from "@/lib/session";
import { SiteHeader } from "@/components/site-header";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";

export const metadata: Metadata = {
  title: "POS - รายการรอชำระเงิน",
  description: "ดูรายการบริการที่รอชำระเงินในระบบ POS",
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

      <BackOfficeContainer>
        <WaitingPaymentList appointments={result.data || []} />
      </BackOfficeContainer>
    </>
  );
}
