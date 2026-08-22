import type { Metadata } from "next";
import { requireStaff } from "@/lib/session";
import { getPOSCheckoutData } from "@/modules/pos/queries/get-pos-data";
import { POSCheckoutForm } from "@/modules/pos/components/POSCheckoutForm";
import { SiteHeader } from "@/components/site-header";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";
import BackButton from "@/components/BackButton";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "ชำระเงิน",
  description: "ดำเนินการชำระเงินและออกใบเสร็จสำหรับรายการบริการ",
};

interface POSPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function POSPage({ params }: POSPageProps) {
  // 1. ตรวจสอบสิทธิ์การเข้าถึง
  await requireStaff();

  // 2. ดึงข้อมูล POS ผ่าน Server Action โดยใช้ appointmentId จาก URL Params
  const { id } = await params;
  const result = await getPOSCheckoutData(id);

  // 3. จัดการ Error State หากไม่พบข้อมูลหรือเกิดข้อผิดพลาด
  if (!result.success || !result.data) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[50vh]">
        <div className="bg-destructive/10 shadow-sm p-6 border border-destructive/20 rounded-xl max-w-md text-destructive text-center">
          <p className="mb-1 font-bold text-lg">ไม่สามารถโหลดข้อมูลได้</p>
          <p className="text-sm">
            {result.error || "ไม่พบข้อมูลการจองนี้ในระบบ"}
          </p>
        </div>
      </div>
    );
  }

  if (result.data.appointment.status !== "READY_FOR_PICKUP") {
    redirect(`/back-office/appointments`);
  }

  // 4. ส่งผ่านข้อมูลที่ดึงมาจาก Database (Source of Truth) ไปยัง Form
  return (
    <>
      <SiteHeader title="ชำระเงิน" />
      <BackOfficeContainer>
        <BackButton />
        <POSCheckoutForm
          appointment={result.data.appointment}
          availablePets={result.data.availablePets}
          availableServices={result.data.availableServices}
          depositAmount={result.data.paidDepositAmount}
        />
      </BackOfficeContainer>
    </>
  );
}
