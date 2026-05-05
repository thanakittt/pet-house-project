import type { Metadata } from "next";
import { requireStaff } from "@/lib/session";
import { getPOSCheckoutData } from "@/modules/pos/queries/get-pos-data";
import { POSCheckoutForm } from "@/modules/pos/components/POSCheckoutForm";
import { SiteHeader } from "@/components/site-header";
import BackButton from "@/components/BackButton";
import { APPOINTMENT_DEPOSIT_AMOUNT } from "@/lib/constants/appointment";

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
        <div className="bg-red-50 shadow-sm p-6 border border-red-100 rounded-xl max-w-md text-red-600 text-center">
          <p className="mb-1 font-bold text-lg">ไม่สามารถโหลดข้อมูลได้</p>
          <p className="text-sm">
            {result.error || "ไม่พบข้อมูลการจองนี้ในระบบ"}
          </p>
        </div>
      </div>
    );
  }

  // 4. ส่งผ่านข้อมูลที่ดึงมาจาก Database (Source of Truth) ไปยัง Form
  return (
    <>
      <SiteHeader title="ชำระเงิน" />
      <div className="p-6">
        <BackButton />
        <POSCheckoutForm
          appointment={result.data.appointment}
          availablePets={result.data.availablePets}
          availableServices={result.data.availableServices}
          depositAmount={APPOINTMENT_DEPOSIT_AMOUNT}
        />
      </div>
    </>
  );
}
