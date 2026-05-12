import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";
import { PaymentSlipVerificationManagement } from "@/modules/payment-slip-verification/components/PaymentSlipVerificationManagement";
import {
  listPaymentSlipVerifications,
  parsePaymentSlipVerificationPage,
  parsePaymentSlipVerificationStatusFilter,
} from "@/modules/payment-slip-verification/queries/list-payment-slip-verifications";

export const metadata: Metadata = {
  title: "จัดการการตรวจสลิป",
  description: "ตรวจสอบประวัติการยืนยันสลิปโอนเงินของลูกค้า",
};

type PaymentSlipVerificationsPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
  }>;
};

export default async function PaymentSlipVerificationsPage({
  searchParams,
}: PaymentSlipVerificationsPageProps) {
  const query = await searchParams;
  const result = await listPaymentSlipVerifications({
    page: parsePaymentSlipVerificationPage(query.page),
    q: query.q,
    status: parsePaymentSlipVerificationStatusFilter(query.status),
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <>
      <SiteHeader title="จัดการการตรวจสลิป" />
      <BackOfficeContainer>
        <PaymentSlipVerificationManagement {...result.data} />
      </BackOfficeContainer>
    </>
  );
}
